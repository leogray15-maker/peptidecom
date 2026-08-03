import "server-only";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import {
  syncMembershipClaim,
  isMember,
  isStaff,
  isActiveStatus,
  RENEWAL_GRACE_MS,
} from "@/lib/auth";
import type { SubscriptionStatus, User } from "@prisma/client";

/** Stripe's subscription status → the status we store on the user row. */
export function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "unpaid":
      return "CANCELED";
    case "incomplete":
    case "incomplete_expired":
      return "INCOMPLETE";
    default:
      return "NONE";
  }
}

function customerIdOf(subscription: Stripe.Subscription): string {
  return typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;
}

/**
 * Write a Stripe subscription's state onto the matching user row.
 *
 * Shared by the webhook and the post-checkout return page, so membership
 * unlocks the moment either one lands — whichever gets there first. Both paths
 * are idempotent, so running both is harmless.
 *
 * The user is normally found by `stripeCustomerId`; `fallbackUserId` (the
 * `userId` we stamp into checkout metadata) covers the case where that link was
 * never written, and backfills it.
 */
export async function syncSubscription(
  subscription: Stripe.Subscription,
  fallbackUserId?: string | null
): Promise<User | null> {
  const customerId = customerIdOf(subscription);

  let user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
  if (!user) {
    const userId = fallbackUserId ?? subscription.metadata?.userId ?? null;
    if (!userId) return null;
    user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
  }

  const item = subscription.items.data[0];
  const status = mapStatus(subscription.status);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: item?.price.id ?? null,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      subscriptionStatus: status,
    },
  });

  // Update the Firebase custom claim so real-time features unlock/lock in step
  // with membership (the client token picks it up on next refresh).
  if (updated.firebaseUid) {
    await syncMembershipClaim(updated.firebaseUid, updated);
  }

  return updated;
}

/**
 * Take a member's access away locally, for the case where Stripe has no
 * subscription for them at all (never completed, or deleted outright) but the
 * row still claims they're paying. Idempotent — a row that already reads as
 * unpaid is left alone.
 */
export async function revokeMembership(user: User): Promise<User> {
  if (!isActiveStatus(user.subscriptionStatus)) return user;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionStatus: "CANCELED" },
  });
  if (updated.firebaseUid) {
    await syncMembershipClaim(updated.firebaseUid, updated);
  }
  return updated;
}

/** Active subscriptions sort first, then the most recently created. */
function bestSubscription(subs: Stripe.Subscription[]): Stripe.Subscription | null {
  const rank = (s: Stripe.Subscription) =>
    s.status === "active" || s.status === "trialing" ? 0 : 1;
  return (
    [...subs].sort((a, b) => rank(a) - rank(b) || b.created - a.created)[0] ?? null
  );
}

/** The subscription Stripe holds for this user, by id where we have one. */
async function fetchSubscription(user: User): Promise<Stripe.Subscription | null> {
  if (user.stripeSubscriptionId) {
    const sub = await stripe.subscriptions
      .retrieve(user.stripeSubscriptionId)
      .catch(() => null);
    if (sub) return sub;
  }
  if (!user.stripeCustomerId) return null;

  const subs = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "all",
    limit: 10,
  });
  return bestSubscription(subs.data);
}

/**
 * Bring a user's stored membership back in line with Stripe — in both
 * directions.
 *
 * The webhook is the normal path, but it can be missing (no
 * `STRIPE_WEBHOOK_SECRET`), misconfigured, or simply slower than Stripe's
 * redirect back to the site, and a webhook that never lands leaves the row
 * frozen at whatever it last said. That cuts both ways: someone who has just
 * paid gets bounced off /dashboard, and someone who cancelled or whose card
 * failed keeps their access forever. So whenever the stored record isn't a
 * clean, current membership we ask Stripe and write down the answer — granting
 * access if they're paid up, taking it away if they aren't.
 *
 * Only runs for users who are already failing the access check (which now
 * includes anyone past their paid-up-to date), so the common case costs
 * nothing. Never throws: on an API error the user keeps whatever the stored
 * record says, which for a lapsed member is still "no access".
 */
export async function reconcileMembership(user: User): Promise<User> {
  if (isStaff(user.role) || isMember(user)) return user;

  try {
    const subscription = await fetchSubscription(user);

    // Stripe has no subscription for them at all — never started one, or it was
    // deleted. Anything the row still claims is stale.
    if (!subscription) return await revokeMembership(user);

    return (await syncSubscription(subscription, user.id)) ?? user;
  } catch (err) {
    console.error("Membership reconcile failed:", err);
    return user;
  }
}

export interface SweepSummary {
  checked: number;
  /** Confirmed still paying — the stored period end moved forward. */
  renewed: number;
  /** Access taken away: cancelled, unpaid, or gone from Stripe entirely. */
  revoked: number;
}

/**
 * Backstop sweep: re-check everyone whose stored membership has gone stale.
 *
 * Access is re-checked on every gated page load, so most lapses are caught the
 * next time the member shows up. This covers the ones who don't — someone who
 * cancels and never returns to the site would otherwise keep their Firestore
 * chat claim, since nothing would ever prompt a re-check.
 *
 * Picks up two groups: members whose paid-up-to date has passed, and anyone
 * sitting in PAST_DUE (whose payment may since have gone through, in which
 * case this restores them). Staff are skipped — their access isn't billing-based.
 */
export async function sweepLapsedMemberships(limit = 200): Promise<SweepSummary> {
  const cutoff = new Date(Date.now() - RENEWAL_GRACE_MS);

  const candidates = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      OR: [
        {
          subscriptionStatus: { in: ["ACTIVE", "TRIALING"] },
          stripeCurrentPeriodEnd: { lt: cutoff },
        },
        { subscriptionStatus: "PAST_DUE" },
      ],
    },
    orderBy: { stripeCurrentPeriodEnd: "asc" },
    take: limit,
  });

  const summary: SweepSummary = { checked: 0, renewed: 0, revoked: 0 };
  for (const user of candidates) {
    const after = await reconcileMembership(user);
    summary.checked += 1;

    // Renewed = they're a current member again (period end moved forward, or a
    // past-due payment went through). Revoked = the row no longer claims to be
    // a paying one.
    if (isMember(after)) {
      summary.renewed += 1;
    } else if (
      isActiveStatus(user.subscriptionStatus) &&
      !isActiveStatus(after.subscriptionStatus)
    ) {
      summary.revoked += 1;
    }
  }
  return summary;
}
