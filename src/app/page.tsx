import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Heart,
  LifeBuoy,
  LineChart,
  ListChecks,
  Lock,
  Map,
  MessagesSquare,
  Ruler,
  ScanEye,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Syringe,
  TrendingUp,
  Trophy,
  UserPlus,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StickyJoinCta } from "@/components/sticky-join-cta";
import {
  MONTHLY_PRICE,
  YEARLY_PER_MONTH,
  YEARLY_PRICE,
  YEARLY_SAVINGS_PCT,
  formatPrice,
} from "@/lib/membership";

// Header reflects auth state, so render per-request.
export const dynamic = "force-dynamic";

const conditions = ["TSW / steroid withdrawal", "Eczema", "Psoriasis", "Acne", "Rosacea"];

// The four newest tools lead the page — they're the reason to join now rather
// than "one day", and they're what nothing else in this space gives you.
const newTools = [
  {
    icon: ScanEye,
    badge: "BETA",
    title: "AI flare grading",
    body: "Photograph a patch and get an instant estimate of redness and severity, scored against your own calmest photo so skin tone and lighting cancel out. Runs on your phone — the image never leaves it. Educational, not diagnostic.",
  },
  {
    icon: Ruler,
    badge: "NEW",
    title: "EASI score",
    body: "The Eczema Area & Severity Index — the same measure dermatologists use in clinic and in trials — worked out for you in a couple of minutes, and tracked over time.",
  },
  {
    icon: ClipboardCheck,
    badge: "NEW",
    title: "POEM weekly score",
    body: "The validated seven-question weekly measure. One score, every week, so you can prove your trend to a sceptical GP instead of describing it.",
  },
  {
    icon: ScanLine,
    badge: "NEW",
    title: "Product & food scanner",
    body: "Scan any barcode. Skincare comes back scored for sensitive skin with every irritant named and ranked; food and drink comes back scored on nutrition. Like Yuka, tuned for skin.",
  },
];

const features = [
  {
    icon: ClipboardList,
    title: "The 20-second daily log",
    body: "Tap a body map, drag a severity slider, pick today's symptoms, sleep and mood. Done before the kettle boils — and it adapts to your condition, so you're never logging someone else's symptoms.",
  },
  {
    icon: Camera,
    title: "Private photo timeline",
    body: "Healing moves slower than memory. Add a photo in seconds and put today side by side with ninety days ago — the comparison you can't do in a mirror.",
  },
  {
    icon: Map,
    title: "“Where am I in this?”",
    body: "Your recovery mapped stage by stage, with what's typical at each one. The single most reassuring screen in the app on a bad week.",
  },
  {
    icon: TrendingUp,
    title: "Patterns from your own data",
    body: "We surface your strongest pattern — the sleep, trigger or routine that actually lines up with your calmer days — plus anonymised averages from other members at your stage. No guessing, no horoscopes.",
  },
  {
    icon: ListChecks,
    title: "Trigger tracking",
    body: "Log products, foods, weather and stress, and let the record catch the culprit you'd never have pinned down from memory alone.",
  },
  {
    icon: LifeBuoy,
    title: "Flare-day support",
    body: "For the days you can't function: itch-wave coping, a breathing guide, cooling tactics and people who've had the same night — in one place, no judgement.",
  },
  {
    icon: BookOpen,
    title: "The healing protocol library",
    body: "Step-by-step protocols across gut, skin, sleep, diet and daily products — the practical stuff, written plainly, with the reasoning left in.",
  },
  {
    icon: Syringe,
    title: "Peptide tracker & calculator",
    body: "For the lab side: every dose on record by compound and milligram, plus a reconstitution calculator that shows the exact syringe units on the barrel. Research purposes only.",
  },
  {
    icon: MessagesSquare,
    title: "Community, chat & the Won wall",
    body: "Moderated forums grouped by stage, a members' WhatsApp chat for the 3am nights, and the Won wall — real recovery stories from members who came out the other side.",
  },
];

const steps = [
  {
    icon: UserPlus,
    title: "Join and set your condition",
    body: "One minute. Everything unlocks at once — no tiers, no upsells, no add-ons. The app reshapes itself around TSW, eczema, psoriasis, acne or rosacea.",
  },
  {
    icon: ClipboardList,
    title: "Log 20 seconds a day",
    body: "Skin, symptoms, sleep, a photo when it matters. Add it to your home screen and it opens like any other app on your phone.",
  },
  {
    icon: LineChart,
    title: "Watch the proof build",
    body: "Within weeks you have a trend line, a photo comparison and clinical scores — something to act on, and something to take to your clinician.",
  },
];

const trust = [
  "Your progress is your own recorded data — a trend you can verify, not a testimonial you have to believe",
  "Recovery stories and progress photos come from real members, shared entirely by their own choice",
  "Actively moderated: no sourcing spam, no miracle cures, no one selling you anything",
  "We sell memberships, not products — which is exactly why the advice inside stays honest",
];

const privacy = [
  "Logs, photos and journal entries are private to you by default — sharing anything is an explicit choice",
  "Flare photos are analysed on your own device, not uploaded to an AI service",
  "Forums and chat are members-only, never indexed, never public",
  "Export everything, or delete your account, whenever you like",
];

const included = [
  "The daily tracker, body map & symptom log",
  "AI flare grading (beta)",
  "EASI & POEM clinical scores",
  "Product & food barcode scanner",
  "Private photo timeline & comparisons",
  "“Where am I?” recovery stage map",
  "Personal patterns & community insights",
  "Trigger tracking",
  "Flare-day support toolkit",
  "The full healing protocol library",
  "Peptide tracker & reconstitution calculator",
  "Forums, WhatsApp chat & the Won wall",
];

const faqs = [
  {
    q: "Is this for my condition?",
    a: "It's built for TSW and steroid withdrawal, eczema and dermatitis, psoriasis, acne and rosacea. You pick yours when you join and the stages, symptoms, body zones and trigger suggestions all change to match — you're never logging someone else's condition.",
  },
  {
    q: "What does membership include?",
    a: `Everything, from minute one: the daily tracker, AI flare grading, EASI and POEM scores, the product scanner, the photo timeline, the stage map, insights, trigger tracking, flare-day support, the protocol library, the peptide tracker and calculator, the forums, the WhatsApp chat and the Won wall. One membership — ${formatPrice(MONTHLY_PRICE)} a month, or ${formatPrice(YEARLY_PRICE)} a year (about £${YEARLY_PER_MONTH} a month, ${YEARLY_SAVINGS_PCT}% off). Nothing is held back for a higher tier, because there isn't one.`,
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — two clicks from your account page. No emails to write, no retention maze. You keep full access until the end of the period you've already paid for.",
  },
  {
    q: "Is this medical advice?",
    a: "No, and it never pretends to be. Arcane Track is a tracking, education and peer-support platform. The AI grading and product scores are educational estimates, not diagnoses. What it does do well is hand your clinician a clear record — dated photos, EASI and POEM scores, and a severity trend — instead of “it's been bad lately”.",
  },
  {
    q: "What if I miss days?",
    a: "Nothing breaks. Streaks are there to encourage you, not to punish you — plenty of members log nothing during the worst weeks and pick it straight back up. A gap in the record is data too.",
  },
  {
    q: "Is my data private?",
    a: "Private by default. Your logs, journal and photos are yours; flare photos are analysed on your own device rather than sent to an AI service; and the forums and chat are visible to members only. Sharing a photo or a story with the community is always a deliberate, separate choice — and you can export or delete everything whenever you want.",
  },
  {
    q: "Does it work on my phone?",
    a: "It's built phone-first. Add it to your home screen and it opens full-screen like a native app, with shortcuts straight to today's log — no app store, no download.",
  },
  {
    q: "Do you sell peptides?",
    a: "No. We sell nothing but membership. Everything discussed is for research and educational purposes only, and nothing here is for human consumption — which is precisely why the discussion stays useful.",
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
              <Sparkles className="h-3.5 w-3.5" /> Now with AI flare grading, EASI, POEM &amp; the
              product scanner
            </span>
            <h1 className="mt-7 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              Know whether you&apos;re
              <span className="block bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
                actually getting better.
              </span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-300">
              Twenty seconds a day turns your skin into evidence — a photo timeline, clinical
              scores, and the patterns behind your flares. Plus a private community of people
              healing the same thing, at the same time.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {conditions.map((c) => (
                <span
                  key={c}
                  className="badge border border-lab-border bg-lab-card text-xs text-slate-300"
                >
                  {c}
                </span>
              ))}
            </div>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/pricing" className="btn-primary px-6 py-3 text-base">
                Start tracking today <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn-secondary px-6 py-3 text-base">
                Member login
              </Link>
            </div>
            <p className="mt-5 text-sm text-slate-400">
              {formatPrice(MONTHLY_PRICE)}/month · or {formatPrice(YEARLY_PRICE)}/year (about £
              {YEARLY_PER_MONTH}/month) · cancel anytime
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Private by default · Peer support &amp; education · Not medical advice
            </p>
          </div>
        </div>
      </section>

      {/* Problem → shift */}
      <section className="border-t border-lab-border py-20">
        <div className="container-lab">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-white">
              The worst part isn&apos;t the flare. It&apos;s not knowing.
            </h2>
            <p className="mt-5 leading-relaxed text-slate-400">
              Recovery from skin conditions happens too slowly to feel. A bad Tuesday wipes out
              the memory of three good weeks, every appointment starts with &ldquo;so how has it
              been?&rdquo; and you answer from the worst day you can remember. Meanwhile the thing
              that&apos;s actually setting you off is hiding in plain sight.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              {
                before: "“I think it's better? Maybe?”",
                after: "A severity trend and a 90-day photo comparison that answers it.",
              },
              {
                before: "“Something set this off, I don't know what.”",
                after: "Logged triggers and your strongest personal pattern, surfaced for you.",
              },
              {
                before: "“It's been bad lately, doctor.”",
                after: "Dated EASI and POEM scores your clinician already trusts.",
              },
            ].map((row) => (
              <div key={row.before} className="card">
                <p className="text-sm italic leading-relaxed text-slate-500">{row.before}</p>
                <div className="my-4 h-px bg-lab-border" />
                <p className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                  {row.after}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New tools */}
      <section id="tools" className="border-t border-lab-border py-20">
        <div className="container-lab">
          <div className="mx-auto max-w-2xl text-center">
            <span className="badge border border-brand-700 bg-brand-950/60 text-brand-200">
              <Sparkles className="h-3.5 w-3.5" /> New in the app
            </span>
            <h2 className="mt-6 text-3xl font-bold text-white">
              Clinical-grade tools, in your pocket
            </h2>
            <p className="mt-4 leading-relaxed text-slate-400">
              The measures dermatologists actually use, plus two things they can&apos;t give you:
              an instant read on a flare, and a scanner that tells you what you&apos;re putting on
              your skin.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {newTools.map((t) => (
              <div key={t.title} className="card border-brand-500/25 bg-gradient-to-br from-brand-950/40 to-lab-card">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-900/60 text-brand-300">
                    <t.icon className="h-5 w-5" />
                  </div>
                  <span className="badge bg-brand-500/15 text-[11px] font-semibold tracking-wide text-brand-200">
                    {t.badge}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Everything else */}
      <section id="features" className="border-t border-lab-border py-20">
        <div className="container-lab">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white">One place for the whole record</h2>
            <p className="mt-4 leading-relaxed text-slate-400">
              Your skin generates data every single day and almost all of it is lost to memory.
              This catches it in seconds and turns it into something you can actually read.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
      <section className="border-t border-lab-border py-20">
        <div className="container-lab">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white">How it works</h2>
            <p className="mt-4 text-slate-400">
              Three small habits. The compounding is the whole point.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
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

      {/* Trust + a day in the app */}
      <section id="trust" className="border-t border-lab-border py-20">
        <div className="container-lab grid items-center gap-14 lg:grid-cols-2">
          <div>
            <span className="badge border border-brand-700 bg-brand-950/60 text-brand-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Built on trust
            </span>
            <h2 className="mt-6 text-3xl font-bold text-white">Nothing here asks for faith</h2>
            <p className="mt-4 leading-relaxed text-slate-400">
              This space exists because the internet&apos;s version of skin advice is a
              marketplace with a comment section. Here, your progress is your own recorded data,
              the recovery stories belong to real members, and nobody is selling you a cure.
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
              <span className="font-semibold text-white">A day in the app</span>
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
                  <Sparkles className="h-4 w-4 text-brand-300" /> Your pattern
                </span>
                <span className="badge bg-brand-900/60 text-brand-200">from your data</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Better-rated nights line up with calmer next days. Protecting your evenings looks
                worth it — in your own two months of logs.
              </p>
            </div>
            <div className="mt-3 rounded-xl border border-lab-border bg-lab-bg p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-white">
                  <Ruler className="h-4 w-4 text-brand-300" /> EASI
                </span>
                <span className="badge bg-emerald-500/15 text-emerald-300">14.2 → 8.6</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                POEM 16 → 11 over six weeks · ready to show at your next appointment
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="border-t border-lab-border py-20">
        <div className="container-lab">
          <div className="mx-auto max-w-2xl text-center">
            <span className="badge border border-brand-700 bg-brand-950/60 text-brand-200">
              <Lock className="h-3.5 w-3.5" /> Private by default
            </span>
            <h2 className="mt-6 text-3xl font-bold text-white">
              Photos of your skin at its worst deserve better than a public feed
            </h2>
          </div>
          <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
            {privacy.map((p) => (
              <div key={p} className="flex items-start gap-3 rounded-xl border border-lab-border bg-lab-card p-4 text-sm leading-relaxed text-slate-300">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community */}
      <section className="border-t border-lab-border py-20">
        <div className="container-lab grid items-center gap-14 lg:grid-cols-2">
          <div className="order-2 grid gap-4 sm:grid-cols-2 lg:order-1">
            {[
              { icon: MessagesSquare, title: "Stage-based forums", body: "Ask the people three months ahead of you." },
              { icon: Heart, title: "WhatsApp chat", body: "For the 3am nights when nobody else is up." },
              { icon: Trophy, title: "The Won wall", body: "Members who came out the other side, in their words." },
              { icon: BookOpen, title: "Protocol library", body: "Gut, skin, sleep, diet and daily products." },
            ].map((c) => (
              <div key={c.title} className="card !p-5">
                <c.icon className="h-5 w-5 text-brand-300" />
                <h3 className="mt-4 font-semibold text-white">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{c.body}</p>
              </div>
            ))}
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl font-bold text-white">
              The part you can&apos;t build alone
            </h2>
            <p className="mt-4 leading-relaxed text-slate-400">
              Skin conditions are lonely in a very particular way: they&apos;re visible, they&apos;re
              exhausting, and everyone around you has run out of things to say. Inside, nobody
              needs the backstory. People know what the 3am itch feels like, what month four
              looks like, and what &ldquo;it&apos;s just dry skin&rdquo; does to you.
            </p>
            <p className="mt-4 leading-relaxed text-slate-400">
              Moderated, members-only, and grouped by where you are in it — so the advice you get
              is from people who were standing exactly there not long ago.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing / value stack */}
      <section id="pricing" className="border-t border-lab-border py-20">
        <div className="container-lab">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white">One membership. Everything included.</h2>
            <p className="mt-4 leading-relaxed text-slate-400">
              No tiers, no add-ons, nothing held back for a &ldquo;pro&rdquo; plan. Less than a
              single tub of the cream that didn&apos;t work.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-6 lg:grid-cols-2">
            <div className="card">
              <h3 className="font-semibold text-white">Everything you get</h3>
              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                {included.map((i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card flex flex-col justify-center bg-gradient-to-br from-brand-900/50 to-lab-card text-center">
              <span className="badge mx-auto border border-brand-500/40 bg-brand-500/10 text-brand-200">
                Save {YEARLY_SAVINGS_PCT}% with yearly
              </span>
              <p className="mt-6 text-5xl font-extrabold tracking-tight text-white">
                {formatPrice(MONTHLY_PRICE)}
                <span className="text-lg font-medium text-slate-400">/month</span>
              </p>
              <p className="mt-3 text-sm text-slate-300">
                or {formatPrice(YEARLY_PRICE)} a year — about £{YEARLY_PER_MONTH} a month
              </p>
              <div className="mt-8">
                <Link href="/pricing" className="btn-primary w-full px-6 py-3 text-base">
                  Join Arcane Track <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-4 text-xs text-slate-400">
                Cancel in two clicks · Keep access to the end of your period
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Already a member?{" "}
                <Link href="/login" className="text-brand-300 hover:text-brand-200">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-lab-border py-20">
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

      {/* Final CTA */}
      <section className="border-t border-lab-border py-20">
        <div className="container-lab">
          <div className="card bg-gradient-to-br from-brand-900/60 to-lab-card py-14 text-center">
            <h2 className="text-3xl font-bold text-white">
              In ninety days you&apos;ll wish you&apos;d started today
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-slate-300">
              The first log is the one that makes every future comparison possible. Twenty
              seconds now, and the whole record starts from here.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <Link href="/pricing" className="btn-primary px-6 py-3 text-base">
                Get instant access <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-xs text-slate-400">
                {formatPrice(MONTHLY_PRICE)}/month or {formatPrice(YEARLY_PRICE)}/year · cancel
                anytime · not medical advice
              </p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* Sticky mobile CTA — the page is long on a phone; the offer shouldn't
          scroll away. Appears once the hero's own CTA is gone. */}
      <StickyJoinCta label={`Start tracking — ${formatPrice(MONTHLY_PRICE)}/mo`} />
      <div className="h-20 sm:hidden" aria-hidden />
    </>
  );
}
