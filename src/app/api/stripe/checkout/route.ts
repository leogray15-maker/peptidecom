import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, STRIPE_PRICES, FOUNDING_FIRST_MONTH_COUPON } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { getFoundingStatus } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { requestAppUrl } from "@/lib/app-url";

/** Build the intro discount. Accepts either a coupon ID or a promotion-code ID
 * (promo_...) in STRIPE_COUPON_FOUNDING_FIRST_MONTH — pasting the wrong one is a
 * common mistake, so we route it to the right Stripe field automatically. */
function introDiscount(): Stripe.Checkout.SessionCreateParams.Discount | null {
  const v = FOUNDING_FIRST_MONTH_COUPON.trim();
  if (!v || v === "promo_or_coupon_id") return null;
  return v.startsWith("promo_") ? { promotion_code: v } : { coupon: v };
}

export async function POST(req: Request) {
  const appUrl = requestAppUrl(req);
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
      {
        error:
          "Subscription price is not configured. Set STRIPE_PRICE_FOUNDING and STRIPE_PRICE_STANDARD in your env vars.",
      },
      { status: 503 }
    );
  }

  const discount = useFounding ? introDiscount() : null;

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
      // Stripe forbids allow_promotion_codes together with discounts, so the
      // intro discount and manual promo codes are mutually exclusive.
      ...(discount ? { discounts: [discount] } : { allow_promotion_codes: true }),
      subscription_data: {
        metadata: { userId: user.id, founding: useFounding ? "true" : "false" },
      },
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      metadata: { userId: user.id, founding: useFounding ? "true" : "false" },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (e) {
    // Surface Stripe's real message so a misconfigured price/coupon is obvious
    // instead of an opaque 500 (e.g. "No such coupon", "No such price").
    const message = e instanceof Error ? e.message : "Could not start checkout.";
    console.error("Stripe checkout failed:", message);
    return NextResponse.json(
      { error: `Stripe: ${message}` },
      { status: 502 }
    );
  }
}
