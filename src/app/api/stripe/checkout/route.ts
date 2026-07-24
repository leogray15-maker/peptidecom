import { NextResponse } from "next/server";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { isPlanId, type PlanId } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { requestAppUrl } from "@/lib/app-url";

export async function POST(req: Request) {
  const appUrl = requestAppUrl(req);
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Which plan? The client sends "monthly" | "yearly"; anything else falls back
  // to monthly. The server always resolves the actual price from env, never the
  // client, so the amount charged can't be tampered with.
  const body = (await req.json().catch(() => ({}))) as { plan?: unknown };
  const plan: PlanId = isPlanId(body.plan) ? body.plan : "monthly";
  const priceId = plan === "yearly" ? STRIPE_PRICES.yearly : STRIPE_PRICES.monthly;

  if (!priceId) {
    const missing = plan === "yearly" ? "STRIPE_PRICE_YEARLY" : "STRIPE_PRICE_MONTHLY";
    return NextResponse.json(
      { error: `Subscription price is not configured. Set ${missing} in your env vars.` },
      { status: 503 }
    );
  }

  try {
    // Ensure a Stripe customer exists for this user.
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user
        .update({ where: { id: user.id }, data: { stripeCustomerId: customerId } })
        .catch(() => {});
    }

    const checkout = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { userId: user.id, plan },
      },
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      metadata: { userId: user.id, plan },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (e) {
    // Surface Stripe's real message so a misconfigured price is obvious instead
    // of an opaque 500 (e.g. "No such price").
    const message = e instanceof Error ? e.message : "Could not start checkout.";
    console.error("Stripe checkout failed:", message);
    return NextResponse.json({ error: `Stripe: ${message}` }, { status: 502 });
  }
}
