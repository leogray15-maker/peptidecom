import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  HeartHandshake,
  MessagesSquare,
  Snowflake,
  Trophy,
  Wind,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PeerSupportNote } from "@/components/peer-support-note";

export const metadata = { title: "Flare-day support" };

const COPING = [
  {
    icon: Snowflake,
    title: "Cool it, don't scratch it",
    body: "A cold compress, a cool shower on the worst patch, or a chilled gel pack over clothing. Cold quiets the same nerves that carry itch — many members keep one in the freezer for nights.",
  },
  {
    icon: Wind,
    title: "Ride the itch wave",
    body: "Itch peaks and passes in waves of a few minutes. When one hits: press or tap the skin instead of scratching, breathe slowly, and count the wave down. You only ever have to outlast this one.",
  },
  {
    icon: HeartHandshake,
    title: "Shrink the day",
    body: "On flare days the to-do list is: skin care, water, food, rest. Everything else is optional. Cancelling plans isn't weakness — it's triage, and everyone here has done it.",
  },
  {
    icon: ClipboardList,
    title: "Log it and let it go",
    body: "Thirty seconds in the tracker turns a horrible day into a data point. Bad days on the chart are what make the good trend visible later.",
  },
];

export default function SupportPage() {
  return (
    <div>
      <PageHeader
        title="Today is bad. We've got you."
        subtitle="This page has one job: get you through the next few hours feeling less alone."
      />

      {/* Grounding */}
      <div className="card flex flex-col items-center py-10 text-center">
        <div className="relative grid h-28 w-28 place-items-center">
          <div className="animate-breathe absolute inset-0 rounded-full bg-brand-500/25" />
          <Wind className="relative h-8 w-8 text-brand-300" />
        </div>
        <p className="mt-5 font-semibold text-white">Breathe with the circle for a minute.</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
          In as it grows, out as it fades. Flares feel permanent from inside them — they are not.
          Every person on the Won wall had days exactly like today.
        </p>
      </div>

      {/* First, the truth */}
      <div className="card mt-6 border-brand-500/30 bg-brand-950/20">
        <p className="text-sm leading-relaxed text-slate-300">
          Three things that are true right now, even if they don&apos;t feel true:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          <li className="flex gap-2"><span className="text-brand-400">1.</span> A flare is a wave, not a verdict. It says nothing about whether you&apos;re healing.</li>
          <li className="flex gap-2"><span className="text-brand-400">2.</span> You have survived 100% of your worst days so far.</li>
          <li className="flex gap-2"><span className="text-brand-400">3.</span> You don&apos;t have to do this hour alone — the community is one tap away.</li>
        </ul>
      </div>

      {/* Coping strategies */}
      <h2 className="mt-8 text-lg font-semibold text-white">Getting through the itch</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {COPING.map((c) => (
          <div key={c.title} className="card">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-900/60 text-brand-300">
              <c.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 font-semibold text-white">{c.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{c.body}</p>
          </div>
        ))}
      </div>

      {/* Reach out */}
      <h2 className="mt-8 text-lg font-semibold text-white">Don&apos;t white-knuckle it alone</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Link href="/chat" className="card group transition hover:border-brand-600">
          <MessagesSquare className="h-5 w-5 text-brand-300" />
          <p className="mt-3 font-semibold text-white">Live chat</p>
          <p className="mt-1 text-sm text-slate-400">Someone is usually around. Say it&apos;s a bad day — that&apos;s enough.</p>
          <ArrowRight className="mt-3 h-4 w-4 text-slate-600 transition group-hover:text-brand-300" />
        </Link>
        <Link href="/won" className="card group transition hover:border-brand-600">
          <Trophy className="h-5 w-5 text-gold-400" />
          <p className="mt-3 font-semibold text-white">Read the Won wall</p>
          <p className="mt-1 text-sm text-slate-400">Proof, in members&apos; own words, that days like today end.</p>
          <ArrowRight className="mt-3 h-4 w-4 text-slate-600 transition group-hover:text-brand-300" />
        </Link>
        <Link href="/resources" className="card group transition hover:border-brand-600">
          <BookOpen className="h-5 w-5 text-brand-300" />
          <p className="mt-3 font-semibold text-white">Comfort resources</p>
          <p className="mt-1 text-sm text-slate-400">Vetted guides on itch, sleep and getting through flares.</p>
          <ArrowRight className="mt-3 h-4 w-4 text-slate-600 transition group-hover:text-brand-300" />
        </Link>
      </div>

      <div className="card mt-8 text-center text-sm text-slate-400">
        If today feels bigger than skin — if you&apos;re struggling to stay safe — please reach out
        to someone you trust or a crisis line in your country right away. You matter more than
        this condition, full stop.
      </div>

      <PeerSupportNote />
    </div>
  );
}
