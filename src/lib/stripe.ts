import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  // Don't throw at import time in dev/build without keys — routes guard usage.
  console.warn("STRIPE_SECRET_KEY is not set. Stripe features will not work.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
  appInfo: {
    name: "The Arcane Lab",
  },
});

export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY ?? "",
  annual: process.env.STRIPE_PRICE_ANNUAL ?? "",
};

/** Statuses that grant access to gated content. */
export const ACTIVE_STATUSES = ["ACTIVE", "TRIALING"] as const;
