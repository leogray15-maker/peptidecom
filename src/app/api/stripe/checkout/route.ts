import { NextResponse } from "next/server";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { plan } = await req.json().catch(() => ({ plan: "monthly" }));
  const priceId = plan === "annual" ? STRIPE_PRICES.annual : STRIPE_PRICES.monthly;

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

  const checkout = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { userId: user.id },
    },
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    metadata: { userId: user.id },
  });

  return NextResponse.json({ url: checkout.url });
}
