import Link from "next/link";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCurrentUser, hasAccess } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { reconcileMembership, syncSubscription } from "@/lib/stripe-sync";

export const metadata = { title: "Payment received" };
export const dynamic = "force-dynamic";

/**
 * Where Stripe sends the member after a successful checkout.
 *
 * This page does the activation itself from the checkout session, instead of
 * trusting the webhook to have already landed. Stripe's redirect regularly beats
 * its own webhook, and if the webhook isn't configured at all it never lands —
 * either way the member would otherwise arrive at /dashboard, fail the paywall
 * check and get bounced back to /pricing having just paid.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    // Signed out (or the session cookie expired while they were on Stripe).
    // The payment is safe — logging back in picks the membership up.
    return (
      <Shell
        title="Payment received 🎉"
        body="Log back in and your membership will be waiting for you."
        action={{ href: "/login?callbackUrl=/dashboard", label: "Log in" }}
      />
    );
  }

  let member = user;

  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription"],
      });

      // Only ever act on a session that belongs to the person who is signed in.
      const ownsSession =
        session.metadata?.userId === user.id ||
        (!!user.stripeCustomerId &&
          (typeof session.customer === "string"
            ? session.customer
            : session.customer?.id) === user.stripeCustomerId);

      const subscription =
        session.subscription && typeof session.subscription !== "string"
          ? session.subscription
          : null;

      if (ownsSession && subscription) {
        member = (await syncSubscription(subscription, user.id)) ?? member;
      }
    } catch (err) {
      console.error("Could not activate membership from checkout session:", err);
    }
  }

  // Belt and braces: if the session lookup didn't get us there (no session id,
  // a subscription still being set up), ask Stripe about the customer directly.
  member = await reconcileMembership(member);

  if (hasAccess(member)) {
    redirect("/dashboard?welcome=1");
  }

  // Paid, but Stripe hasn't finished setting the subscription up yet (bank
  // authentication, a delayed payment method). Give them a way to retry rather
  // than a dead end.
  return (
    <Shell
      title="Payment received — just finishing up"
      body="Stripe is still confirming your subscription. This usually takes a few seconds. If it doesn't unlock, contact us and we'll sort it out straight away."
      action={{ href: "/dashboard", label: "Try my dashboard again" }}
      spinner
    />
  );
}

function Shell({
  title,
  body,
  action,
  spinner,
}: {
  title: string;
  body: string;
  action: { href: string; label: string };
  spinner?: boolean;
}) {
  return (
    <>
      <SiteHeader />
      <section className="py-20">
        <div className="container-lab max-w-lg">
          <div className="card text-center">
            {spinner && (
              <Loader2 className="mx-auto mb-4 h-6 w-6 animate-spin text-brand-400" />
            )}
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{body}</p>
            <Link href={action.href} className="btn-primary mt-6">
              {action.label}
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
