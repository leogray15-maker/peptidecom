// Subscription plans.
//
// Two plans, billed through Stripe: a monthly plan and a yearly plan that comes
// in at over 50% off the monthly rate. These are DISPLAY values — the real
// charges come from the Stripe price IDs (STRIPE_PRICE_MONTHLY /
// STRIPE_PRICE_YEARLY). Keep them in sync with Stripe.
//
// Pure constants and rules — safe to import from both server and client code.
// The access rules live here (rather than in lib/auth) so they can be unit
// tested without pulling in Firebase, Prisma or `server-only`.

import type { Role, SubscriptionStatus } from "@prisma/client";

export type PlanId = "monthly" | "yearly";

export const MONTHLY_PRICE = 11.99; // £/month
export const YEARLY_PRICE = 70; // £/year

/** How much cheaper the yearly plan is than 12× the monthly price (rounded). */
export const YEARLY_SAVINGS_PCT = Math.round(
  (1 - YEARLY_PRICE / (MONTHLY_PRICE * 12)) * 100
);

/** Yearly price expressed as an equivalent per-month figure, e.g. "5.83". */
export const YEARLY_PER_MONTH = (YEARLY_PRICE / 12).toFixed(2);

export interface Plan {
  id: PlanId;
  label: string;
  /** Headline price in £. */
  price: number;
  interval: "month" | "year";
  /** Suffix shown after the price, e.g. "/month". */
  cadence: string;
  /** Small print under the price. */
  billedText: string;
  /** Optional highlight pill, e.g. "BEST VALUE". */
  badge?: string;
}

export const PLANS: Record<PlanId, Plan> = {
  yearly: {
    id: "yearly",
    label: "Yearly",
    price: YEARLY_PRICE,
    interval: "year",
    cadence: "/year",
    billedText: `Billed once a year — save ${YEARLY_SAVINGS_PCT}%`,
    badge: "BEST VALUE",
  },
  monthly: {
    id: "monthly",
    label: "Monthly",
    price: MONTHLY_PRICE,
    interval: "month",
    cadence: "/month",
    billedText: "Billed monthly",
  },
};

/** Display order — the highlighted yearly plan comes first. */
export const PLAN_LIST: Plan[] = [PLANS.yearly, PLANS.monthly];

export function isPlanId(v: unknown): v is PlanId {
  return v === "monthly" || v === "yearly";
}

/** Format a £ amount without trailing ".00" (so £70, but £11.99). */
export function formatPrice(amount: number): string {
  return Number.isInteger(amount) ? `£${amount}` : `£${amount.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Access rules
//
// One question, asked the same way everywhere: is this account entitled to the
// member area right now? Page layouts, API routes and the Firestore claim all
// go through hasAccess(), so access can never be granted in one place and
// denied in another.
// ---------------------------------------------------------------------------

/** Subscription statuses that grant access. */
const ACTIVE_STATUSES: SubscriptionStatus[] = ["ACTIVE", "TRIALING"];

/**
 * How long past the paid-up-to date access survives.
 *
 * Stripe bills at the period boundary and the renewal (invoice paid →
 * subscription updated) takes a moment to reach us, so a short grace window
 * stops a genuinely paying member being locked out mid-renewal. Past the
 * window, membership is treated as lapsed until Stripe confirms otherwise —
 * see reconcileMembership() in lib/stripe-sync.
 */
export const RENEWAL_GRACE_MS = 6 * 60 * 60 * 1000; // 6 hours

/** The billing fields any membership decision is made from. */
export interface MembershipRecord {
  subscriptionStatus: SubscriptionStatus;
  stripeCurrentPeriodEnd?: Date | null;
}

/** True when the status alone grants access, ignoring how old it is. */
export function isActiveStatus(status?: SubscriptionStatus | null) {
  return !!status && ACTIVE_STATUSES.includes(status);
}

/**
 * True when the period this member paid for has run out (beyond the grace
 * window). A record with no period end is never lapsed — that's an account
 * whose access doesn't come from Stripe at all (preview mode, comped staff).
 */
export function isLapsed(user: MembershipRecord, now: number = Date.now()) {
  const end = user.stripeCurrentPeriodEnd;
  if (!end) return false;
  return now > end.getTime() + RENEWAL_GRACE_MS;
}

/**
 * True when this record is a paid-up member right now.
 *
 * Deliberately stricter than the stored status: a cancellation or a failed
 * renewal that never reached us leaves the row saying ACTIVE forever, so the
 * paid-up-to date has to agree as well. Callers gating access should use
 * hasAccess(), which also lets staff through.
 */
export function isMember(user?: MembershipRecord | null, now?: number) {
  if (!user) return false;
  return isActiveStatus(user.subscriptionStatus) && !isLapsed(user, now);
}

/** Whether a role is elevated (staff), which bypasses the paywall. */
export function isStaff(role?: Role | null) {
  return role === "ADMIN" || role === "MODERATOR";
}

/** Full access = a paid-up subscription OR staff (admin/moderator). */
export function hasAccess(
  user?: (MembershipRecord & { role: Role }) | null,
  now?: number
) {
  if (!user) return false;
  return isStaff(user.role) || isMember(user, now);
}
