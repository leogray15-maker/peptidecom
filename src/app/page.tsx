import Link from "next/link";
import {
  ShieldCheck,
  FlaskConical,
  Users,
  Calculator,
  LineChart,
  Store,
  MessageSquare,
  PackageCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const features = [
  {
    icon: ShieldCheck,
    title: "Vendor verification",
    body: "Community-vetted vendors with verified badges, ratings and price history — so you know who you're dealing with.",
  },
  {
    icon: FlaskConical,
    title: "Lab test library",
    body: "Third-party purity and mass-spec results tied to vendors and batches. Trust that's evidenced, not claimed.",
  },
  {
    icon: Calculator,
    title: "Reconstitution calculator",
    body: "Enter your vial, water and target dose — get exact units on an insulin syringe. Presets for every common peptide.",
  },
  {
    icon: LineChart,
    title: "Progress tracking",
    body: "Log weight, measurements, side-effects and photos. Watch your data trend over weeks with clean charts.",
  },
  {
    icon: PackageCheck,
    title: "Group buys",
    body: "Coordinate group buys, hit volume thresholds and unlock member-only pricing together.",
  },
  {
    icon: MessageSquare,
    title: "Real community",
    body: "Honest, moderated discussion. No shills, no noise — just members sharing what actually works.",
  },
];

const trust = [
  "Every vendor is community-reviewed and can be independently lab-tested",
  "Test results are attached to real batches, not marketing claims",
  "Moderated discussion — scam reports surfaced, bad actors removed",
  "Your progress data is private to you by default",
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(53,99,255,0.18),transparent)]" />
        <div className="container-lab py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="badge border border-brand-700 bg-brand-950/60 text-brand-200">
              <Users className="h-3.5 w-3.5" /> The #1 grey-market peptide community
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              Real testing. Real results.
              <span className="block bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
                Real community.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
              A private, members-only community for peptide research — vendor
              verification, independent lab testing, dosing tools and progress
              tracking, all in one clean, trustworthy place.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/pricing" className="btn-primary px-6 py-3 text-base">
                Join for £25/month <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn-secondary px-6 py-3 text-base">
                Member log in
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Cancel anytime · For research purposes only
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-lab-border py-20">
        <div className="container-lab">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-white">Everything the community needs</h2>
            <p className="mt-3 text-slate-400">
              We took what works on the group and built proper tools around it.
            </p>
          </div>
          <div id="tools" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="card">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-900/60 text-brand-300">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="border-t border-lab-border py-20">
        <div className="container-lab grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="badge border border-brand-700 bg-brand-950/60 text-brand-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Built on trust
            </span>
            <h2 className="mt-5 text-3xl font-bold text-white">
              Authenticity is the whole point
            </h2>
            <p className="mt-3 text-slate-400">
              The grey market runs on trust. We make that trust verifiable — with
              testing, transparency and a moderated community that has no tolerance
              for scams.
            </p>
            <ul className="mt-6 space-y-3">
              {trust.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-brand-300" />
              <span className="font-semibold text-white">Example vendor card</span>
            </div>
            <div className="mt-4 rounded-xl border border-lab-border bg-lab-bg p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Vendor A</span>
                <span className="badge bg-emerald-500/15 text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified
                </span>
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-slate-400">
                <span>★ 4.8 · 63 reviews</span>
                <span>3 lab tests</span>
                <span>99.2% purity</span>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-lab-border">
                <div className="h-full w-[96%] rounded-full bg-gradient-to-r from-brand-400 to-brand-600" />
              </div>
              <p className="mt-2 text-xs text-slate-500">Community trust score 96/100</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-lab-border py-20">
        <div className="container-lab">
          <div className="card bg-gradient-to-br from-brand-900/60 to-lab-card text-center">
            <h2 className="text-3xl font-bold text-white">Join the lab</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">
              £25/month. Cancel anytime. Get instant access to the community,
              tools and every lab test.
            </p>
            <div className="mt-7">
              <Link href="/pricing" className="btn-primary px-6 py-3 text-base">
                Get access <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
