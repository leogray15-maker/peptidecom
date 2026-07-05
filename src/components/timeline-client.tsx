"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, MapPin } from "lucide-react";
import { TSW_STAGES, type MilestoneDef } from "@/lib/tsw";
import { MilestoneCelebration } from "@/components/milestone-celebration";
import { cn } from "@/lib/utils";

export function TimelineClient({ currentStage }: { currentStage: string | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState<MilestoneDef[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function mark(stageId: string) {
    setSaving(stageId);
    setError(null);
    const res = await fetch("/api/tsw/stage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: stageId }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(null);
    if (!res.ok) {
      setError(data.error ?? "Couldn't save your stage.");
      return;
    }
    if (Array.isArray(data.newMilestones) && data.newMilestones.length > 0) {
      setCelebrating(data.newMilestones);
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <MilestoneCelebration milestones={celebrating} onClose={() => setCelebrating([])} />
      {error && <p className="text-sm text-rose-400">{error}</p>}

      <ol className="relative space-y-4 before:absolute before:bottom-6 before:left-[19px] before:top-6 before:w-px before:bg-lab-border">
        {TSW_STAGES.map((stage, i) => {
          const isHere = currentStage === stage.id;
          return (
            <li key={stage.id} className="relative pl-12">
              <span
                className={cn(
                  "absolute left-0 top-5 grid h-10 w-10 place-items-center rounded-full border text-sm font-bold",
                  isHere
                    ? "border-brand-400 bg-brand-500/20 text-brand-200"
                    : "border-lab-border bg-lab-card text-slate-500"
                )}
              >
                {isHere ? <MapPin className="h-4 w-4" /> : i + 1}
              </span>
              <div className={cn("card", isHere && "border-brand-500/60")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-white">{stage.name}</h2>
                      {isHere && (
                        <span className="badge bg-brand-500/20 text-brand-200">You are here ✦</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs uppercase tracking-wider text-slate-500">{stage.timeframe}</p>
                  </div>
                  {!isHere && (
                    <button
                      onClick={() => mark(stage.id)}
                      disabled={saving !== null}
                      className="btn-secondary !px-3 !py-1.5 text-xs"
                    >
                      {saving === stage.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      This is where I am
                    </button>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{stage.summary}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Many people experience
                </p>
                <ul className="mt-1.5 space-y-1 text-sm text-slate-400">
                  {stage.experiences.map((e) => (
                    <li key={e} className="flex gap-2">
                      <span className="text-brand-400">·</span> {e}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="px-2 text-center text-xs text-slate-500">
        Timeframes are rough patterns from the community, not predictions. Your body sets its own
        pace — being &quot;behind&quot; a timeline isn&apos;t a thing.
      </p>
    </div>
  );
}
