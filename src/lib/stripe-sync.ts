import "server-only";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { syncMembershipClaim, isMember, isStaff } from "@/lib/auth";
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
    await syncMembershipClaim(updated.firebaseUid, status, updated.role);
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

/**
 * Self-healing membership check for a user our database thinks isn't paying.
 *
 * The webhook is the normal path, but it can be missing (no
 * `STRIPE_WEBHOOK_SECRET`), misconfigured, or simply slower than Stripe's
 * redirect back to the site. Without this, someone who has genuinely just paid
 * gets bounced from /dashboard to /pricing with no way through. So before we
 * turn a paying member away, we ask Stripe directly.
 *
 * Only ever called for users who are already failing the access check and have
 * a Stripe customer on file, so it costs one API call on the failure path and
 * nothing at all in the common case. Never throws — on any error the caller
 * just carries on with the user it already had.
 */
export async function reconcileMembership(user: User): Promise<User> {
  if (isStaff(user.role) || isMember(user.subscriptionStatus)) return user;
  if (!user.stripeCustomerId) return user;

  try {
    const subs = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "all",
      limit: 10,
    });
    const subscription = bestSubscription(subs.data);
    if (!subscription) return user;

    const updated = await syncSubscription(subscription, user.id);
    return updated ?? user;
  } catch (err) {
    console.error("Membership reconcile failed:", err);
    return user;
  }
}
