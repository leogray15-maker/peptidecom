import { Compass, Feather, Flame, Sparkles } from "lucide-react";
import { ArchivesCta, ArchivesViewTracker } from "@/components/archives-funnel";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "The Archives" };

const PILLARS = [
  {
    icon: Flame,
    title: "Resilience, kept",
    body: "You've built a tolerance for hard days that most people never develop. The Archives is where that stops being a survival skill and becomes a life skill.",
  },
  {
    icon: Compass,
    title: "Agency, reclaimed",
    body: "Recovery taught you to stop outsourcing your wellbeing and start running your own experiments. That same posture — applied to work, habits, relationships.",
  },
  {
    icon: Feather,
    title: "A story, not a scar",
    body: "What happened to your skin becomes a chapter, not the whole book. The Archives helps you write the next ones deliberately.",
  },
];

export default function ArchivesPage() {
  const url = process.env.NEXT_PUBLIC_ARCHIVES_URL ?? null;

  return (
    <div>
      <ArchivesViewTracker />
      <PageHeader
        title="The Archives"
        subtitle="The next chapter — for when recovery starts giving you room to think about more than skin."
      />

      <div className="card relative overflow-hidden border-gold-500/25">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/30 to-gold-500/30">
            <Sparkles className="h-6 w-6 text-gold-300" />
          </div>
          <h2 className="mt-5 max-w-xl text-2xl font-bold leading-snug text-white">
            You didn&apos;t just survive withdrawal. You trained something.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
            Everyone who walks through TSW comes out the other side with something hard-won:
            patience under pressure, self-trust against expert opinion, the ability to keep going
            with no guarantees. The Arcane Archives is our personal-development membership — a
            place to take what this taught you and build with it on purpose.
          </p>
          <div className="mt-6">
            <ArchivesCta url={url} />
          </div>
          <p className="mt-4 text-xs text-slate-500">
            No pressure, no countdown. The Lab is complete on its own — this door is simply here
            whenever you&apos;re ready to look through it.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {PILLARS.map((p) => (
          <div key={p.title} className="card">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold-500/10 text-gold-300">
              <p.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 font-semibold text-white">{p.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
