"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Loader2, MapPin } from "lucide-react";
import { TSW_STAGES, type MilestoneDef, dateKey, daysBetween } from "@/lib/tsw";
import { MilestoneCelebration } from "@/components/milestone-celebration";
import { cn } from "@/lib/utils";

/** Optional "when did you stop?" anchor. Feeds the personal recovery clock and
 * the anonymised day-since-start cohort curves. */
function StartDateCard({ startDate }: { startDate: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(startDate ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/tsw/start-date", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: value || null }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't save.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  const days = startDate ? daysBetween(startDate, dateKey()) : null;

  return (
    <div className="card">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-brand-300" />
        <p className="font-semibold text-white">When did you stop steroids?</p>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Optional — it anchors your recovery clock, so your charts and community comparisons
        line up with how far along you actually are.
        {days != null && days >= 0 && (
          <span className="text-slate-300"> You&apos;re {days} days in.</span>
        )}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="date"
          className="input max-w-48"
          value={value}
          max={dateKey()}
          onChange={(e) => setValue(e.target.value)}
        />
        <button onClick={save} disabled={saving || value === (startDate ?? "")} className="btn-secondary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
          Save
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
    </div>
  );
}

export function TimelineClient({
  currentStage,
  startDate,
}: {
  currentStage: string | null;
  startDate: string | null;
}) {
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
      <StartDateCard startDate={startDate} />
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
