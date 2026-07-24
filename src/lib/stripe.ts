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
  // Monthly recurring price (£11.99/mo). Falls back to the legacy env names so
  // an existing deploy keeps charging while the new vars are added.
  monthly:
    process.env.STRIPE_PRICE_MONTHLY ??
    process.env.STRIPE_PRICE_STANDARD ??
    process.env.STRIPE_PRICE_FOUNDING ??
    "",
  // Yearly recurring price (£70/yr — over 50% off the monthly rate).
  yearly: process.env.STRIPE_PRICE_YEARLY ?? "",
};

/** Statuses that grant access to gated content. */
export const ACTIVE_STATUSES = ["ACTIVE", "TRIALING"] as const;
