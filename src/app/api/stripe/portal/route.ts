import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser, hasAccess } from "@/lib/auth";
import { requestAppUrl } from "@/lib/app-url";

export async function POST(req: Request) {
  const appUrl = requestAppUrl(req);
  const user = await getCurrentUser();
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found." }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    // A lapsed member can't reach /settings — send them back to the page that
    // explains where they stand instead of into a redirect.
    return_url: `${appUrl}${hasAccess(user) ? "/settings" : "/pricing"}`,
  });

  return NextResponse.json({ url: session.url });
}
