import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProofStrip } from "@/components/results-section";
import { getCurrentUser, hasAccess } from "@/lib/auth";
import { MONTHLY_PRICE, YEARLY_PRICE, YEARLY_SAVINGS_PCT, formatPrice } from "@/lib/membership";
import { PricingPlans } from "@/components/pricing-plans";
import { reconcileMembership } from "@/lib/stripe-sync";
import { ManageBillingButton } from "@/components/manage-billing-button";
import { WhopEvent } from "@/components/whop-pixel";

export const metadata = { title: "Pricing" };
export const dynamic = "force-dynamic";

// Everything behind the membership, grouped the way the app is. Nothing here is
// an add-on or a higher tier — the whole list unlocks the moment you join, so
// the list has to actually show the whole list.
const perks: { group: string; items: string[] }[] = [
  {
    group: "Track your day",
    items: [
      "Daily skin & recovery tracker — body map, severity, symptoms, sleep and mood, in about 20 seconds",
      "Private photo timeline — compare today against 90 days ago, side by side",
      "Itch check-in — one tap whenever it bites, and it finds the hour your itch actually peaks",
      "Trigger tracking — products, foods, weather and stress, so you catch what flares you",
      "“Where am I in this?” stage map for TSW, eczema, psoriasis, acne or rosacea",
    ],
  },
  {
    group: "Measure & understand",
    items: [
      "EASI calculator — the published Eczema Area & Severity Index your dermatologist uses",
      "POEM weekly score — the validated 7-question measure, tracked week on week",
      "Coach — today's plan, built from your own logs and what your data is saying",
      "Your trends — severity, sleep and patterns surfaced from everything you've logged",
      "Flare forecast — local humidity, cold, wind and pollen scored against your condition",
      "AI flare grading — photograph a patch for an on-device inflammation estimate (never uploaded)",
      "Flare-day support tools for the hardest days",
    ],
  },
  {
    group: "Know what you're putting in and on you",
    items: [
      "Ingredient scanner — scan any barcode for a 0–100 skincare score for sensitive, eczema-prone skin",
      "Food & drink scanning — nutrition, additives and the good stuff, from the same barcode",
      "Healthy places to eat — every restaurant, café and takeaway near you on a map, scored 0–100",
    ],
  },
  {
    group: "The peptide lab",
    items: [
      "Peptide tracker — every dose on record, with per-compound totals and full dose history",
      "Reconstitution calculator — vial strength, water and target dose to exact syringe units",
      "Peptide library — what each compound is, how long it lasts and how protocols typically run it",
      "Research journal — rate progress toward skin, weight, muscle, focus or sleep and watch the trend",
    ],
  },
  {
    group: "The community & the library",
    items: [
      "The healing protocol library — gut, skin, sleep, diet & biohacking, step by step",
      "Members-only forums, WhatsApp chat & the Won recovery-stories wall",
      "The Archives — what comes next, for when recovery gives you room to think about more than skin",
      "Your logs, photos and journal stay private to you by default — sharing is always your call",
    ],
  },
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  let user = await getCurrentUser();
  const authed = !!user;

  // Anyone who lands here signed in but locked out may simply have paid without
  // the webhook landing — ask Stripe before showing them the pricing table again.
  if (user && !hasAccess(user)) {
    user = await reconcileMembership(user);
  }
  const member = hasAccess(user);

  // Someone who used to be paying and isn't any more deserves a reason, not the
  // sales page they saw before they joined. Read from their own record, so it
  // can't be faked with a query parameter.
  const lapsed = !member && user
    ? user.subscriptionStatus === "PAST_DUE"
      ? {
          title: "Your last payment didn't go through",
          body: "Your membership is paused until it clears. Update your card and everything unlocks again straight away — your logs, photos and history are all still here.",
        }
      : user.stripeCustomerId
        ? {
            title: "Your membership has ended",
            body: "Access to the tools and community is paused, but nothing has been deleted — your logs, photos and history are waiting. Resubscribe below and they come straight back.",
          }
        : null
    : null;

  return (
    <>
      {/* The offer page. Reported to Whop only for someone who can still buy —
          a member re-reading what they already pay for isn't a funnel step. */}
      {!member && <WhopEvent event="view_content" />}
      <SiteHeader />
      <section className="border-b border-lab-border py-16">
        <div className="container-lab text-center">
          <span className="badge mb-5 border border-brand-500/40 bg-brand-500/10 text-brand-200">
            Save {YEARLY_SAVINGS_PCT}% with yearly
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            One membership. Everything included.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Every tool, the full protocol library and the whole community — one membership.{" "}
            <span className="font-semibold text-white">{formatPrice(MONTHLY_PRICE)}/month</span> or{" "}
            <span className="font-semibold text-white">{formatPrice(YEARLY_PRICE)}/year</span>{" "}
            (over 50% off). Cancel anytime.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-lab grid gap-8 lg:grid-cols-2">
          <div className="card">
            <h2 className="text-xl font-semibold text-white">What&apos;s included</h2>
            <p className="mt-2 text-sm text-slate-400">
              Every tool below, from the moment you join. No tiers, no add-ons, nothing held back.
            </p>
            <div className="mt-6 space-y-6">
              {perks.map((section) => (
                <div key={section.group}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-300">
                    {section.group}
                  </h3>
                  <ul className="mt-3 space-y-3">
                    {section.items.map((p) => (
                      <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-slate-300">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            {member ? (
              <div className="card text-center">
                <p className="text-lg font-semibold text-white">
                  You&apos;re already a member 🎉
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Your membership is active. Head to your dashboard.
                </p>
                <Link href="/dashboard" className="btn-primary mt-6">
                  Go to dashboard
                </Link>
              </div>
            ) : authed ? (
              <div className="space-y-4">
                {lapsed && (
                  <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
                    <p className="font-semibold text-white">{lapsed.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-amber-100/80">
                      {lapsed.body}
                    </p>
                    <div className="mt-4">
                      <ManageBillingButton />
                    </div>
                  </div>
                )}
                {checkout === "cancelled" && (
                  <p className="rounded-2xl border border-lab-border bg-lab-card p-4 text-sm text-slate-400">
                    Checkout was cancelled — you haven&apos;t been charged. Pick a plan
                    whenever you&apos;re ready.
                  </p>
                )}
                <PricingPlans />
              </div>
            ) : (
              <div className="card text-center">
                <p className="text-lg font-semibold text-white">Create an account first</p>
                <p className="mt-2 text-sm text-slate-400">
                  You&apos;ll pick your plan right after signing up.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <Link href="/register" className="btn-primary">Sign up</Link>
                  <Link href="/login" className="btn-secondary">I already have an account</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Social proof — the same wall as /results, trimmed to three quotes. */}
      <section className="border-t border-lab-border py-16">
        <div className="container-lab">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-white">What it looks like when it works</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Members&apos; own words, published with their permission. Individual experiences —
              not typical results, and not medical advice.
            </p>
          </div>
          <div className="mt-10">
            <ProofStrip />
          </div>
          <div className="mt-8 text-center">
            <Link href="/results" className="btn-secondary">
              See the results wall, with photos
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
