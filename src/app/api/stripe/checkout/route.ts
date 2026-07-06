import { NextResponse } from "next/server";
import { stripe, STRIPE_PRICES, FOUNDING_FIRST_MONTH_COUPON } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { getFoundingStatus } from "@/lib/membership";
import { prisma } from "@/lib/prisma";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // The server decides the price — never the client. Founding pricing is only
  // offered while the offer is genuinely open (slots left AND before deadline).
  const status = await getFoundingStatus();
  const useFounding = status.open;
  const priceId = useFounding ? STRIPE_PRICES.founding : STRIPE_PRICES.standard;

  if (!priceId) {
    return NextResponse.json(
      { error: "Subscription price is not configured. Set STRIPE_PRICE_* env vars." },
      { status: 500 }
    );
  }

  // Ensure a Stripe customer exists for this user.
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const applyIntroCoupon = useFounding && !!FOUNDING_FIRST_MONTH_COUPON;

  const checkout = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    // Stripe forbids allow_promotion_codes together with discounts, so the
    // intro coupon and manual promo codes are mutually exclusive.
    ...(applyIntroCoupon
      ? { discounts: [{ coupon: FOUNDING_FIRST_MONTH_COUPON }] }
      : { allow_promotion_codes: true }),
    subscription_data: {
      metadata: { userId: user.id, founding: useFounding ? "true" : "false" },
    },
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    metadata: { userId: user.id, founding: useFounding ? "true" : "false" },
  });

  return NextResponse.json({ url: checkout.url });
}
