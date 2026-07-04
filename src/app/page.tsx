import Link from "next/link";
import {
  ShieldCheck,
  FlaskConical,
  Users,
  Calculator,
  LineChart,
  Store,
  MessagesSquare,
  PackageCheck,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  Search,
  TrendingUp,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Header reflects auth state, so render per-request.
export const dynamic = "force-dynamic";

const features = [
  {
    icon: ShieldCheck,
    title: "Vendor verification",
    body: "Community-vetted vendors with earned verification badges, honest ratings and price history. Know exactly who you're dealing with before you spend a penny.",
  },
  {
    icon: FlaskConical,
    title: "Lab test library",
    body: "Independent HPLC purity and mass-spec results, tied to real vendors and batches. Trust you can check for yourself — not marketing claims.",
  },
  {
    icon: Calculator,
    title: "Reconstitution calculator",
    body: "Enter your vial strength, water and target dose — get the exact units to draw on an insulin syringe. Presets for every major peptide.",
  },
  {
    icon: LineChart,
    title: "Progress tracking",
    body: "Log weight, measurements, side-effects and photos. Watch your data trend over weeks with clean, private charts only you can see.",
  },
  {
    icon: PackageCheck,
    title: "Group buys",
    body: "Pool orders with other members to unlock volume pricing. Coordinate, track and split the best deals — together.",
  },
  {
    icon: MessagesSquare,
    title: "Live community",
    body: "Real-time chat and moderated forums. Straight talk from people actually running research — no shills, no noise, no hype.",
  },
];

const trust = [
  "Every vendor is community-reviewed and independently lab-tested",
  "Purity results are tied to real batches — verifiable, not claimed",
  "Moderated around the clock: scams flagged, bad actors removed",
  "Your progress and personal data stay private to you by default",
];

const steps = [
  {
    icon: UserPlus,
    title: "Join the lab",
    body: "Create your account and unlock the full community, tools and test library in seconds.",
  },
  {
    icon: Search,
    title: "Do your research",
    body: "Check vendor lab tests, calculate your doses, and ask the community before you commit.",
  },
  {
    icon: TrendingUp,
    title: "Track what works",
    body: "Log your protocol and progress, and share results that help the whole community level up.",
  },
];

const faqs = [
  {
    q: "What do I get for £25/month?",
    a: "Full access to the community, every vendor lab test, the reconstitution calculator, progress tracking, group buys and live chat. One membership — everything included.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Manage or cancel your membership in a couple of clicks from your account — no emails, no hassle. You keep access until the end of your billing period.",
  },
  {
    q: "Do you sell peptides?",
    a: "No. The Arcane Lab is an information and community platform for research purposes only. We don't sell anything — we help you research safely and verify what's real.",
  },
  {
    q: "Is my data private?",
    a: "Your progress logs and personal data are private to you by default. Community posts and chat are visible to members only, never the public.",
  },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(124,92,255,0.20),transparent)]" />
        <div className="container-lab py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="badge border border-brand-700 bg-brand-950/60 text-brand-200">
              <Users className="h-3.5 w-3.5" /> Private membership · UK research community
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              Every vial verified.
              <span className="block bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
                Every vendor vetted.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
              The Arcane Lab is a private community for serious peptide research —
              independent lab tests on every vendor, a precision dosing calculator,
              progress tracking and honest, moderated discussion. Evidence over hype.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/pricing" className="btn-primary px-6 py-3 text-base">
                Join The Arcane Lab — £25/mo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn-secondary px-6 py-3 text-base">
                Member login
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
            <h2 className="text-3xl font-bold text-white">Built for researchers who verify</h2>
            <p className="mt-3 text-slate-400">
              Everything you need to source smart, dose right and track what actually
              works — in one clean, trustworthy place.
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

      {/* How it works */}
      <section className="border-t border-lab-border py-20">
        <div className="container-lab">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-white">How it works</h2>
            <p className="mt-3 text-slate-400">From sign-up to smarter research in minutes.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="card">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-900/60 text-sm font-bold text-brand-300">
                    {i + 1}
                  </span>
                  <s.icon className="h-5 w-5 text-brand-300" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{s.body}</p>
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
              Authenticity isn&apos;t a tagline — it&apos;s the product
            </h2>
            <p className="mt-3 text-slate-400">
              The grey market runs on trust. So we make trust something you can
              verify: independent testing, full transparency, and zero tolerance for
              scams.
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
                <span className="font-semibold text-white">Aurora Research</span>
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

      {/* FAQ */}
      <section className="border-t border-lab-border py-20">
        <div className="container-lab">
          <h2 className="text-3xl font-bold text-white">Questions, answered</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {faqs.map((f) => (
              <div key={f.q} className="card">
                <h3 className="font-semibold text-white">{f.q}</h3>
                <p className="mt-2 text-sm text-slate-400">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-lab-border py-20">
        <div className="container-lab">
          <div className="card bg-gradient-to-br from-brand-900/60 to-lab-card text-center">
            <h2 className="text-3xl font-bold text-white">Research with confidence</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">
              £25/month. Cancel anytime. Instant access to the community, every tool
              and every lab test.
            </p>
            <div className="mt-7">
              <Link href="/pricing" className="btn-primary px-6 py-3 text-base">
                Get instant access <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
