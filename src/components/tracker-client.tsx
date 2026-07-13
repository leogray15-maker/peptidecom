"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Moon, Pencil, Trash2 } from "lucide-react";
import {
  type DailyLog,
  type MilestoneDef,
  SYMPTOMS,
  dateKey,
  zoneLabel,
} from "@/lib/tsw";
import { BodyMap } from "@/components/body-map";
import { MilestoneCelebration } from "@/components/milestone-celebration";
import { cn, formatDate } from "@/lib/utils";

const symptomLabel = (id: string) => SYMPTOMS.find((s) => s.id === id)?.label ?? id;

const MOODS = ["😞", "😕", "😐", "🙂", "😊"];

function severityColor(s: number) {
  if (s <= 3) return "bg-emerald-400";
  if (s <= 6) return "bg-amber-400";
  return "bg-rose-400";
}

/** The daily quick-log. Designed to be completed in under 20 seconds:
 * tap zones → drag one slider → tap chips → save. Everything else optional.
 * The 7-day strip doubles as a date picker, so a missed day can be filled in
 * after the fact and any recent entry re-opened for editing. */
export function TrackerClient({ recentLogs }: { recentLogs: DailyLog[] }) {
  const router = useRouter();
  const today = dateKey();
  const todayLog = recentLogs.find((l) => l.date === today) ?? null;

  const [selectedDate, setSelectedDate] = useState(today);
  const [editing, setEditing] = useState(todayLog === null);
  const [celebrating, setCelebrating] = useState<MilestoneDef[]>([]);
  const [savedNow, setSavedNow] = useState(false);

  const selectedLog = recentLogs.find((l) => l.date === selectedDate) ?? null;

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

  function pickDay(date: string) {
    setSelectedDate(date);
    setEditing(true);
  }

  async function removeLog(date: string) {
    if (!confirm("Delete this day's entry? This can't be undone.")) return;
    await fetch(`/api/tsw/log?date=${date}`, { method: "DELETE" });
    router.refresh();
  }

  function onSaved(newMilestones: MilestoneDef[]) {
    if (selectedDate === today) setSavedNow(true);
    setSelectedDate(today);
    setEditing(false);
    if (newMilestones.length > 0) setCelebrating(newMilestones);
    router.refresh();
  }

  const showDoneCard = !editing && (todayLog || savedNow);

  return (
    <div className="space-y-6">
      <MilestoneCelebration milestones={celebrating} onClose={() => setCelebrating([])} />

      {/* Week strip — tap a day to log it or edit what's there */}
      <div className="card">
        <p className="mb-1 text-sm font-medium text-slate-300">Your last 7 days</p>
        <p className="mb-3 text-xs text-slate-500">Tap a day to fill it in or change it — missed days aren&apos;t lost.</p>
        <div className="flex justify-between gap-2">
          {week.map((d) => {
            const active = editing && d.date === selectedDate;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => pickDay(d.date)}
                title={d.log ? `Severity ${d.log.severity}/10 — tap to edit` : "Not logged — tap to fill in"}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1.5 rounded-xl py-1.5 transition hover:bg-white/5",
                  active && "bg-brand-500/15 ring-1 ring-brand-500/50"
                )}
              >
                <span className={cn("text-[10px]", active ? "text-brand-200" : "text-slate-500")}>
                  {new Date(d.date + "T12:00").toLocaleDateString("en-GB", { weekday: "short" })}
                </span>
                <span
                  className={cn(
                    "h-3.5 w-3.5 rounded-full",
                    d.log ? severityColor(d.log.severity) : "border border-lab-border bg-transparent"
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      {showDoneCard ? (
        <div className="card flex flex-col items-center py-10 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          <p className="mt-4 text-lg font-semibold text-white">Today is logged. Well done.</p>
          <p className="mt-1 max-w-sm text-sm text-slate-400">
            Showing up on the hard days counts double. That&apos;s the whole job — see you tomorrow.
          </p>
          <button onClick={() => pickDay(today)} className="btn-secondary mt-6">
            <Pencil className="h-4 w-4" /> Edit today&apos;s entry
          </button>
        </div>
      ) : (
        <LogEditor
          key={selectedDate}
          date={selectedDate}
          isToday={selectedDate === today}
          log={selectedLog}
          onSaved={onSaved}
          onBackToToday={selectedDate !== today ? () => pickDay(today) : undefined}
        />
      )}

      {/* Look back — every past entry, so you can see where it was and when */}
      {recentLogs.length > 0 && (
        <div className="card">
          <p className="font-semibold text-white">Look back</p>
          <p className="mt-0.5 text-sm text-slate-500">
            Every day you&apos;ve logged — where it was, how rough it felt, and what you noted.
          </p>
          <div className="mt-3 divide-y divide-lab-border">
            {[...recentLogs]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((l) => (
                <div key={l.date} className="flex items-start justify-between gap-3 py-3.5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-white">{formatDate(l.date)}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-bold text-black",
                          severityColor(l.severity)
                        )}
                      >
                        {l.severity}/10
                      </span>
                      {l.sleep != null && (
                        <span className="text-xs text-slate-500">sleep {l.sleep}/5</span>
                      )}
                      {l.mood != null && <span className="text-sm">{MOODS[l.mood - 1]}</span>}
                    </div>
                    {(l.areas.length > 0 || l.symptoms.length > 0) && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {l.areas.map((a) => (
                          <span key={a} className="badge border border-brand-800 bg-brand-950/60 text-brand-200">
                            {zoneLabel(a)}
                          </span>
                        ))}
                        {l.symptoms.map((s) => (
                          <span key={s} className="badge border border-lab-border text-slate-400">
                            {symptomLabel(s)}
                          </span>
                        ))}
                      </div>
                    )}
                    {l.note && <p className="mt-1.5 text-xs text-slate-500">“{l.note}”</p>}
                  </div>
                  <button
                    onClick={() => removeLog(l.date)}
                    className="shrink-0 text-slate-600 hover:text-rose-400"
                    aria-label={`Delete entry for ${l.date}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** The quick-log form for a single day. Keyed by date from the parent so its
 * state re-initialises whenever a different day is picked. */
function LogEditor({
  date,
  isToday,
  log,
  onSaved,
  onBackToToday,
}: {
  date: string;
  isToday: boolean;
  log: DailyLog | null;
  onSaved: (newMilestones: MilestoneDef[]) => void;
  onBackToToday?: () => void;
}) {
  const [areas, setAreas] = useState<string[]>(log?.areas ?? []);
  const [severity, setSeverity] = useState(log?.severity ?? 4);
  const [symptoms, setSymptoms] = useState<string[]>(log?.symptoms ?? []);
  const [sleep, setSleep] = useState<number | null>(log?.sleep ?? null);
  const [mood, setMood] = useState<number | null>(log?.mood ?? null);
  const [note, setNote] = useState(log?.note ?? "");
  const [showNote, setShowNote] = useState(Boolean(log?.note));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (list: string[], set: (v: string[]) => void) => (id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/tsw/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
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
    onSaved(Array.isArray(data.newMilestones) ? data.newMilestones : []);
  }

  return (
    <div className="card space-y-7">
      {!isToday && (
        <div className="flex items-center justify-between rounded-xl bg-brand-900/40 px-4 py-2.5">
          <p className="text-sm font-medium text-brand-200">
            {log ? "Editing" : "Filling in"} {formatDate(date)}
          </p>
          {onBackToToday && (
            <button
              type="button"
              onClick={onBackToToday}
              className="text-sm text-slate-400 hover:text-slate-200"
            >
              Back to today
            </button>
          )}
        </div>
      )}

      {/* 1 — body map */}
      <div>
        <p className="font-semibold text-white">
          {isToday ? "Where is it today?" : "Where was it that day?"}
        </p>
        <p className="mb-3 text-sm text-slate-500">Tap everywhere that&apos;s affected. Skip if nowhere — that&apos;s a great day.</p>
        <BodyMap selected={areas} onToggle={toggle(areas, setAreas)} />
      </div>

      {/* 2 — severity */}
      <div>
        <div className="flex items-baseline justify-between">
          <p className="font-semibold text-white">How rough {isToday ? "is" : "was"} it overall?</p>
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
          <p className="mb-3 font-semibold text-white">
            {isToday ? "Last night's sleep" : "Sleep that night"}
          </p>
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
          placeholder="Anything worth remembering about that day? (optional)"
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
        {log ? `Update ${isToday ? "today's" : "this"} log` : isToday ? "Log today" : `Log ${formatDate(date)}`}
      </button>
    </div>
  );
}
