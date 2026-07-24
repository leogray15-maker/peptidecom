import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCurrentUser, hasAccess } from "@/lib/auth";
import { MONTHLY_PRICE, YEARLY_PRICE, YEARLY_SAVINGS_PCT, formatPrice } from "@/lib/membership";
import { PricingPlans } from "@/components/pricing-plans";

export const metadata = { title: "Pricing" };
export const dynamic = "force-dynamic";

const perks = [
  "Daily skin & recovery tracker — body map, severity, symptoms, sleep and mood",
  "Private photo timeline — compare today against 90 days ago, side by side",
  "“Where am I?” withdrawal stage map to see exactly where you are",
  "Insights & trends built from your own logged data",
  "Trigger tracking to catch what flares you up",
  "Flare-day support tools for the hardest days",
  "The healing protocol library — gut, skin, sleep, diet & biohacking",
  "Peptide tracker & reconstitution calculator",
  "Members-only community, WhatsApp chat & the Won recovery-stories wall",
];

export default async function PricingPage() {
  const user = await getCurrentUser();
  const authed = !!user;
  const member = hasAccess(user);

  return (
    <>
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
            <ul className="mt-5 space-y-3">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                  {p}
                </li>
              ))}
            </ul>
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
              <PricingPlans />
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
      <SiteFooter />
    </>
  );
}
