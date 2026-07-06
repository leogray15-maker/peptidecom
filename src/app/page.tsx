import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  Camera,
  CheckCircle2,
  ClipboardList,
  LineChart,
  MessagesSquare,
  ShieldCheck,
  Syringe,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Header reflects auth state, so render per-request.
export const dynamic = "force-dynamic";

const features = [
  {
    icon: ClipboardList,
    title: "Daily skin tracker",
    body: "Log your day in under twenty seconds — a tappable body map, severity, symptoms, sleep and mood. Every entry is kept, so you can look back at exactly where things were, and when.",
  },
  {
    icon: Camera,
    title: "Photo progress timeline",
    body: "Private by default. Add a photo in seconds, then compare today against ninety days ago side by side — healing moves slower than memory, and the timeline remembers for you.",
  },
  {
    icon: Syringe,
    title: "Peptide tracker",
    body: "Every dose on record: compound, milligrams, date, and what you're running it for. Per-peptide totals and full dose history build themselves as you log.",
  },
  {
    icon: Calculator,
    title: "Reconstitution calculator",
    body: "Vial strength, water added, target dose — get the exact syringe units with a visual fill on the barrel. Presets for every major compound and syringe type.",
  },
  {
    icon: LineChart,
    title: "Research journal & insights",
    body: "Rate progress toward the goal you actually care about — skin, muscle, cognition, sleep, weight — and watch your own trend line. Charts reflect your data back; they never guess.",
  },
  {
    icon: MessagesSquare,
    title: "Community & protocols",
    body: "Moderated forums grouped by recovery stage, a wall of member recovery stories, a WhatsApp community, and curated step-by-step protocols from the lab.",
  },
];

const trust = [
  "Built on your own tracked data — trends you can verify, not testimonials you have to take on faith",
  "Recovery stories and progress photos come from real members, shared by their own choice",
  "Actively moderated: no sourcing spam, no miracle claims, no bad actors",
  "Logs, photos and personal data are private to you by default — sharing is always opt-in",
];

const steps = [
  {
    icon: UserPlus,
    title: "Join",
    body: "Membership takes a minute, and everything unlocks at once — every tool, the full community. No tiers, no add-ons.",
  },
  {
    icon: ClipboardList,
    title: "Track",
    body: "Log your skin, doses and routine in seconds a day. The lab handles the totals, streaks and history for you.",
  },
  {
    icon: TrendingUp,
    title: "Review",
    body: "Charts, photo comparisons and milestones turn scattered days into a record you can act on — and, when it matters, bring to a professional.",
  },
];

const faqs = [
  {
    q: "What do I get for £25/month?",
    a: "Everything, immediately: the daily skin tracker, photo timeline, peptide tracker, reconstitution calculator, research journal and insights, curated protocols, the community forums and the WhatsApp chat. One membership — nothing held back.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Manage or cancel your membership in a couple of clicks from your account — no emails, no retention hoops. You keep access until the end of your billing period.",
  },
  {
    q: "Do you sell peptides?",
    a: "No. The Arcane Lab is an information, tracking and community platform for research purposes only. We sell nothing but membership — which is exactly why the discussion stays honest.",
  },
  {
    q: "Is my data private?",
    a: "Your logs, journal and photos are private to you by default; sharing anything with the community is always an explicit choice. Forums and chat are visible to members only, never the public.",
  },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(124,92,255,0.20),transparent)]" />
        <div className="container-lab py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <span className="badge border border-brand-700 bg-brand-950/60 text-brand-200">
              <Users className="h-3.5 w-3.5" /> Private membership · Research & recovery community
            </span>
            <h1 className="mt-7 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              Every dose logged.
              <span className="block bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
                Every day mapped.
              </span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-300">
              The Arcane Lab is a private members&apos; platform for peptide research and skin
              recovery — precision dosing tools, effortless daily tracking, curated protocols and
              a moderated community that runs on evidence, not hype.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/pricing" className="btn-primary px-6 py-3 text-base">
                Join The Arcane Lab — £25/mo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn-secondary px-6 py-3 text-base">
                Member login
              </Link>
            </div>
            <p className="mt-5 text-xs text-slate-500">
              Cancel anytime · For research purposes only · Not medical advice
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-lab-border py-24">
        <div className="container-lab">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white">One place for the whole record</h2>
            <p className="mt-4 leading-relaxed text-slate-400">
              Research generates data every single day — most of it lost to memory. The lab
              captures it in seconds and turns it into something you can actually read.
            </p>
          </div>
          <div id="tools" className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="card">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-900/60 text-brand-300">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-lab-border py-24">
        <div className="container-lab">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white">How it works</h2>
            <p className="mt-4 text-slate-400">
              Three habits, a few seconds each. The compounding is the point.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="card">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-900/60 text-sm font-bold text-brand-300">
                    {i + 1}
                  </span>
                  <s.icon className="h-5 w-5 text-brand-300" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="border-t border-lab-border py-24">
        <div className="container-lab grid items-center gap-14 lg:grid-cols-2">
          <div>
            <span className="badge border border-brand-700 bg-brand-950/60 text-brand-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Built on trust
            </span>
            <h2 className="mt-6 text-3xl font-bold text-white">
              Verifiable by design
            </h2>
            <p className="mt-4 leading-relaxed text-slate-400">
              A membership like this only works if you can trust what&apos;s inside it. So nothing
              here asks for faith: your progress is your own recorded data, the success stories
              are real members&apos;, and moderation keeps the noise out.
            </p>
            <ul className="mt-8 space-y-3.5">
              {trust.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm leading-relaxed text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <LineChart className="h-5 w-5 text-brand-300" />
              <span className="font-semibold text-white">A day in the lab</span>
            </div>
            <div className="mt-4 rounded-xl border border-lab-border bg-lab-bg p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Tuesday, day 142</span>
                <span className="badge bg-emerald-500/15 text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 3/10 · calm day
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="badge border border-brand-800 bg-brand-950/60 text-brand-200">Elbow creases</span>
                <span className="badge border border-brand-800 bg-brand-950/60 text-brand-200">Neck</span>
                <span className="badge border border-lab-border text-slate-400">Flaking</span>
                <span className="text-slate-500">sleep 4/5 · 🙂</span>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-lab-border">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-brand-400 to-brand-600" />
              </div>
              <p className="mt-2 text-xs text-slate-500">12-day streak · 9 days since last bad flare</p>
            </div>
            <div className="mt-3 rounded-xl border border-lab-border bg-lab-bg p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-white">
                  <Syringe className="h-4 w-4 text-brand-300" /> GHK-Cu
                </span>
                <span className="badge bg-brand-900/60 text-brand-200">1 mg · ✨ Skin</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Week 3 — texture noticeably smoother · 21 doses logged
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-lab-border py-24">
        <div className="container-lab">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white">Questions, answered</h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {faqs.map((f) => (
              <div key={f.q} className="card">
                <h3 className="font-semibold text-white">{f.q}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-lab-border py-24">
        <div className="container-lab">
          <div className="card bg-gradient-to-br from-brand-900/60 to-lab-card py-14 text-center">
            <h2 className="text-3xl font-bold text-white">Start your record today</h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-slate-300">
              £25/month, cancel anytime. Every tool and the full community from the moment you
              join — and a day-one entry you&apos;ll be glad you made in ninety days.
            </p>
            <div className="mt-8">
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
