import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  // Don't throw at import time in dev/build without keys — routes guard usage.
  console.warn("STRIPE_SECRET_KEY is not set. Stripe features will not work.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
  appInfo: {
    name: "Arcane Track",
  },
});

export const STRIPE_PRICES = {
  // Founding recurring price (£45/mo) — first 50 members lock this in for life.
  founding:
    process.env.STRIPE_PRICE_FOUNDING ?? process.env.STRIPE_PRICE_MONTHLY ?? "",
  // Standard recurring price (£55/mo) — everyone after the founding offer closes.
  standard:
    process.env.STRIPE_PRICE_STANDARD ?? process.env.STRIPE_PRICE_MONTHLY ?? "",
};

/** One-time coupon that discounts a founding member's FIRST invoice down to the
 * £28 intro price (i.e. ~£17 off, duration: once). Applied at checkout. */
export const FOUNDING_FIRST_MONTH_COUPON =
  process.env.STRIPE_COUPON_FOUNDING_FIRST_MONTH ?? "";

/** Statuses that grant access to gated content. */
export const ACTIVE_STATUSES = ["ACTIVE", "TRIALING"] as const;
