"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Moon, Pencil } from "lucide-react";
import {
  type DailyLog,
  type MilestoneDef,
  SYMPTOMS,
  dateKey,
} from "@/lib/tsw";
import { BodyMap } from "@/components/body-map";
import { MilestoneCelebration } from "@/components/milestone-celebration";
import { cn } from "@/lib/utils";

const MOODS = ["😞", "😕", "😐", "🙂", "😊"];

function severityColor(s: number) {
  if (s <= 3) return "bg-emerald-400";
  if (s <= 6) return "bg-amber-400";
  return "bg-rose-400";
}

/** The daily quick-log. Designed to be completed in under 20 seconds:
 * tap zones → drag one slider → tap chips → save. Everything else optional. */
export function TrackerClient({ recentLogs }: { recentLogs: DailyLog[] }) {
  const router = useRouter();
  const today = dateKey();
  const todayLog = recentLogs.find((l) => l.date === today) ?? null;

  const [editing, setEditing] = useState(todayLog === null);
  const [areas, setAreas] = useState<string[]>(todayLog?.areas ?? []);
  const [severity, setSeverity] = useState(todayLog?.severity ?? 4);
  const [symptoms, setSymptoms] = useState<string[]>(todayLog?.symptoms ?? []);
  const [sleep, setSleep] = useState<number | null>(todayLog?.sleep ?? null);
  const [mood, setMood] = useState<number | null>(todayLog?.mood ?? null);
  const [note, setNote] = useState(todayLog?.note ?? "");
  const [showNote, setShowNote] = useState(Boolean(todayLog?.note));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState<MilestoneDef[]>([]);
  const [savedNow, setSavedNow] = useState(false);

  const toggle = (list: string[], set: (v: string[]) => void) => (id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  // Last 7 days strip
  const week = useMemo(() => {
    const byDate = new Map(recentLogs.map((l) => [l.date, l]));
    const days: { date: string; log: DailyLog | null }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      days.push({ date: key, log: byDate.get(key) ?? null });
    }
    return days;
  }, [recentLogs]);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/tsw/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: today,
        areas,
        severity,
        symptoms,
        sleep,
        mood,
        note: note.trim() || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't save. Please try again.");
      return;
    }
    setSavedNow(true);
    setEditing(false);
    if (Array.isArray(data.newMilestones) && data.newMilestones.length > 0) {
      setCelebrating(data.newMilestones);
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <MilestoneCelebration milestones={celebrating} onClose={() => setCelebrating([])} />

      {/* Week strip */}
      <div className="card">
        <p className="mb-3 text-sm font-medium text-slate-300">Your last 7 days</p>
        <div className="flex justify-between gap-2">
          {week.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[10px] text-slate-500">
                {new Date(d.date + "T12:00").toLocaleDateString("en-GB", { weekday: "short" })}
              </span>
              <span
                title={d.log ? `Severity ${d.log.severity}/10` : "Not logged"}
                className={cn(
                  "h-3.5 w-3.5 rounded-full",
                  d.log ? severityColor(d.log.severity) : "border border-lab-border bg-transparent"
                )}
              />
            </div>
          ))}
        </div>
      </div>

      {!editing && (todayLog || savedNow) ? (
        <div className="card flex flex-col items-center py-10 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          <p className="mt-4 text-lg font-semibold text-white">Today is logged. Well done.</p>
          <p className="mt-1 max-w-sm text-sm text-slate-400">
            Showing up on the hard days counts double. That&apos;s the whole job — see you tomorrow.
          </p>
          <button onClick={() => setEditing(true)} className="btn-secondary mt-6">
            <Pencil className="h-4 w-4" /> Edit today&apos;s entry
          </button>
        </div>
      ) : (
        <div className="card space-y-7">
          {/* 1 — body map */}
          <div>
            <p className="font-semibold text-white">Where is it today?</p>
            <p className="mb-3 text-sm text-slate-500">Tap everywhere that&apos;s affected. Skip if nowhere — that&apos;s a great day.</p>
            <BodyMap selected={areas} onToggle={toggle(areas, setAreas)} />
          </div>

          {/* 2 — severity */}
          <div>
            <div className="flex items-baseline justify-between">
              <p className="font-semibold text-white">How rough is it overall?</p>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-sm font-bold text-black",
                  severityColor(severity)
                )}
              >
                {severity}/10
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={severity}
              onChange={(e) => setSeverity(parseInt(e.target.value, 10))}
              className="mt-3 w-full accent-brand-500"
              aria-label="Severity from 1 to 10"
            />
            <div className="mt-1 flex justify-between text-[11px] text-slate-500">
              <span>Calm</span>
              <span>Managing</span>
              <span>Really hard</span>
            </div>
          </div>

          {/* 3 — symptoms */}
          <div>
            <p className="mb-3 font-semibold text-white">What&apos;s it doing?</p>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(symptoms, setSymptoms)(s.id)}
                  className={cn(
                    "rounded-xl border px-4 py-2 text-sm font-medium transition",
                    symptoms.includes(s.id)
                      ? "border-brand-500 bg-brand-500/20 text-brand-200"
                      : "border-lab-border text-slate-400 hover:border-brand-700 hover:text-slate-200"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4 — sleep & mood */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-3 font-semibold text-white">Last night&apos;s sleep</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSleep(sleep === n ? null : n)}
                    aria-label={`Sleep quality ${n} of 5`}
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-xl border transition",
                      sleep != null && n <= sleep
                        ? "border-brand-500 bg-brand-500/20 text-brand-200"
                        : "border-lab-border text-slate-500 hover:text-slate-300"
                    )}
                  >
                    <Moon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 font-semibold text-white">Mood</p>
              <div className="flex gap-2">
                {MOODS.map((emoji, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMood(mood === i + 1 ? null : i + 1)}
                    aria-label={`Mood ${i + 1} of 5`}
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-xl border text-lg transition",
                      mood === i + 1
                        ? "border-brand-500 bg-brand-500/20"
                        : "border-lab-border opacity-60 hover:opacity-100"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5 — optional note */}
          {showNote ? (
            <textarea
              className="input min-h-20"
              placeholder="Anything worth remembering about today? (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowNote(true)}
              className="text-sm text-slate-500 hover:text-slate-300"
            >
              + Add a note (optional)
            </button>
          )}

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button onClick={save} disabled={saving} className="btn-primary w-full py-3 text-base">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {todayLog ? "Update today's log" : "Log today"}
          </button>
        </div>
      )}
    </div>
  );
}
