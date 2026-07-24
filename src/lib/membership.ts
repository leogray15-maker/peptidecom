// Subscription plans.
//
// Two plans, billed through Stripe: a monthly plan and a yearly plan that comes
// in at over 50% off the monthly rate. These are DISPLAY values — the real
// charges come from the Stripe price IDs (STRIPE_PRICE_MONTHLY /
// STRIPE_PRICE_YEARLY). Keep them in sync with Stripe.
//
// Pure constants — safe to import from both server and client code.

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
