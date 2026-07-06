import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCurrentUser, hasAccess } from "@/lib/auth";
import { getFoundingStatus } from "@/lib/membership";
import { PricingPlans } from "@/components/pricing-plans";

export const metadata = { title: "Pricing" };
export const dynamic = "force-dynamic";

const perks = [
  "Daily skin & recovery tracker — body map, severity, symptoms, sleep and mood",
  "Private photo timeline — compare today against 90 days ago, side by side",
  "“Where am I?” withdrawal stage map to see exactly where you are",
  "Insights & trends built from your own logged data",
  "Trigger tracking to catch what flares you up",
  "Doctor prep — a printable appointment summary in one tap",
  "Flare-day support tools for the hardest days",
  "The healing protocol library — gut, skin, sleep, diet & biohacking",
  "Peptide tracker & reconstitution calculator",
  "Members-only community, WhatsApp chat & the Won recovery-stories wall",
];

export default async function PricingPage() {
  const user = await getCurrentUser();
  const authed = !!user;
  const member = hasAccess(user);
  const founding = await getFoundingStatus();

  return (
    <>
      <SiteHeader />
      <section className="border-b border-lab-border py-16">
        <div className="container-lab text-center">
          {founding.open && (
            <span className="badge mb-5 border border-gold-500/40 bg-gold-500/10 text-gold-200">
              Founding offer · {founding.taken} of {founding.limit} members in · {founding.remaining} spot{founding.remaining === 1 ? "" : "s"} left
            </span>
          )}
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            One membership. Everything included.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            {founding.open ? (
              <>
                Get in as a founding member: <span className="font-semibold text-white">£{founding.intro} your first month</span>,
                then <span className="font-semibold text-white">£{founding.founding}/month locked in for life</span>.
                After the offer closes it&apos;s £{founding.standard}/month. Cancel anytime.
              </>
            ) : (
              <>Every tool, the full protocol library and the whole community — one membership, cancel anytime.</>
            )}
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
              <PricingPlans founding={founding} />
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
