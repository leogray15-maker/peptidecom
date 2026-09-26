"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, Loader2, Pencil, Trash2 } from "lucide-react";
import { anySymptomLabel, anyZoneLabel } from "@/lib/conditions";
import { type DailyLog, type MilestoneDef, type BodyZone, dateKey } from "@/lib/tsw";
import { BodyMap, type BodyView } from "@/components/body-map";
import { MilestoneCelebration } from "@/components/milestone-celebration";
import { SCORE_COLOR, SegmentedControl, SeverityBadge, Tag } from "@/components/ui";
import { severityLevel, severityWord } from "@/lib/tokens";
import { cn, formatDate } from "@/lib/utils";

interface SymptomOption {
  id: string;
  label: string;
}

/** Mood 1–5, in words rather than faces. */
const MOODS = ["Low", "Flat", "Okay", "Good", "Great"];
const SLEEP = ["Awful", "Poor", "Okay", "Good", "Great"];

const dayParts = (key: string) => {
  const d = new Date(key + "T12:00");
  return {
    weekday: d.toLocaleDateString("en-GB", { weekday: "short" }),
    day: d.getDate(),
    long: d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" }),
  };
};

/** The daily quick-log. Designed to be completed in under 20 seconds:
 * tap zones → tap a severity → tap symptoms → save. Everything else optional.
 * The 7-day strip doubles as a date picker, so a missed day can be filled in
 * after the fact and any recent entry re-opened for editing. */
export function TrackerClient({
  recentLogs,
  zones,
  symptoms,
}: {
  recentLogs: DailyLog[];
  zones: BodyZone[];
  symptoms: SymptomOption[];
}) {
  const router = useRouter();
  const today = dateKey();
  const todayLog = recentLogs.find((l) => l.date === today) ?? null;

  const [selectedDate, setSelectedDate] = useState(today);
  const [editing, setEditing] = useState(todayLog === null);
  const [celebrating, setCelebrating] = useState<MilestoneDef[]>([]);
  const [savedNow, setSavedNow] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

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
    setDeleting(date);
    setListError(null);
    try {
      const res = await fetch(`/api/tsw/log?date=${date}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setListError(data.error ?? "Couldn't delete the entry.");
        return;
      }
      router.refresh();
    } catch {
      setListError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setDeleting(null);
    }
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
    <div className="space-y-4">
      <MilestoneCelebration milestones={celebrating} onClose={() => setCelebrating([])} />

      {/* Week strip — tap a day to log it or edit what's there */}
      <div role="group" aria-label="Last 7 days — pick a day to log or edit" className="grid grid-cols-7 gap-1.5 sm:gap-3">
        {week.map((d) => {
          const p = dayParts(d.date);
          const isToday = d.date === today;
          const active = editing && d.date === selectedDate;
          return (
            <button
              key={d.date}
              type="button"
              onClick={() => pickDay(d.date)}
              aria-pressed={active}
              aria-label={`${p.long}${isToday ? " (today)" : ""}: ${
                d.log ? `severity ${d.log.severity} of 10, ${severityWord(d.log.severity)}` : "not logged"
              }`}
              className={cn(
                "flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-control border py-2.5 transition-colors duration-150 ease-out sm:min-h-[72px]",
                active
                  ? "border-primary bg-surface-active"
                  : isToday
                    ? "border-primary/70 bg-surface hover:bg-surface-active"
                    : "border-line bg-surface hover:border-line-strong hover:bg-surface-active"
              )}
            >
              <span className="text-[11.5px] text-fg-muted">{p.weekday}</span>
              <span className="font-mono text-[15px] font-semibold tabular-nums text-fg sm:text-[17px]">{p.day}</span>
              <span
                className={cn("h-1.5 w-1.5 rounded-full", !d.log && "bg-line-strong")}
                style={d.log ? { backgroundColor: SCORE_COLOR[severityLevel(d.log.severity)] } : undefined}
                aria-hidden
              />
            </button>
          );
        })}
      </div>

      {showDoneCard ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <CheckCircle2 className="h-9 w-9 text-score-excellent" strokeWidth={1.75} aria-hidden />
          <p className="mt-4 text-lg font-semibold text-fg">Today is logged. Well done.</p>
          <p className="mt-1 max-w-sm text-sm text-fg-secondary">
            Showing up on the hard days counts double. That&apos;s the whole job — see you tomorrow.
          </p>
          <button onClick={() => pickDay(today)} className="btn-secondary mt-6">
            <Pencil className="h-4 w-4" aria-hidden /> Edit today&apos;s entry
          </button>
        </div>
      ) : (
        <LogEditor
          key={selectedDate}
          date={selectedDate}
          isToday={selectedDate === today}
          log={selectedLog}
          zones={zones}
          symptoms={symptoms}
          onSaved={onSaved}
          onBackToToday={selectedDate !== today ? () => pickDay(today) : undefined}
        />
      )}

      {/* Look back — every past entry, so you can see where it was and when */}
      {recentLogs.length > 0 && (
        <section className="card" aria-labelledby="lookback-title">
          <h2 id="lookback-title" className="card-title">
            Look back
          </h2>
          <p className="mt-0.5 text-meta text-fg-muted">
            Every day you&apos;ve logged. Tap the pencil to correct any entry.
          </p>
          {listError && (
            <p role="alert" className="field-error">
              {listError}
            </p>
          )}
          <ul className="mt-3 divide-y divide-line-subtle">
            {[...recentLogs]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((l) => (
                <li key={l.date} className="flex items-start justify-between gap-3 py-3.5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-fg">{formatDate(l.date)}</p>
                      <SeverityBadge value={l.severity} size="sm" />
                      {l.sleep != null && (
                        <span className="text-meta text-fg-muted">Sleep {l.sleep}/5</span>
                      )}
                      {l.mood != null && (
                        <span className="text-meta text-fg-muted">Mood: {MOODS[l.mood - 1]}</span>
                      )}
                    </div>
                    {(l.areas.length > 0 || l.symptoms.length > 0) && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {l.areas.map((a) => (
                          <Tag key={a} className="border-primary/50 text-fg">
                            {anyZoneLabel(a)}
                          </Tag>
                        ))}
                        {l.symptoms.map((s) => (
                          <Tag key={s}>{anySymptomLabel(s)}</Tag>
                        ))}
                      </div>
                    )}
                    {l.note && <p className="mt-1.5 text-meta text-fg-muted">“{l.note}”</p>}
                  </div>
                  <div className="flex shrink-0 items-center">
                    <button
                      onClick={() => pickDay(l.date)}
                      className="grid h-10 w-10 place-items-center rounded-control text-fg-muted hover:bg-surface-active hover:text-fg"
                      aria-label={`Edit entry for ${formatDate(l.date)}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      onClick={() => removeLog(l.date)}
                      disabled={deleting === l.date}
                      className="grid h-10 w-10 place-items-center rounded-control text-fg-muted hover:bg-surface-active hover:text-score-bad disabled:opacity-50"
                      aria-label={`Delete entry for ${formatDate(l.date)}`}
                    >
                      {deleting === l.date ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <Trash2 className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </section>
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
  zones,
  symptoms: symptomOptions,
  onSaved,
  onBackToToday,
}: {
  date: string;
  isToday: boolean;
  log: DailyLog | null;
  zones: BodyZone[];
  symptoms: SymptomOption[];
  onSaved: (newMilestones: MilestoneDef[]) => void;
  onBackToToday?: () => void;
}) {
  const [areas, setAreas] = useState<string[]>(log?.areas ?? []);
  const [severity, setSeverity] = useState(log?.severity ?? 4);
  const [symptoms, setSymptoms] = useState<string[]>(log?.symptoms ?? []);
  const [sleep, setSleep] = useState<number | null>(log?.sleep ?? null);
  const [mood, setMood] = useState<number | null>(log?.mood ?? null);
  const [note, setNote] = useState(log?.note ?? "");
  const [view, setView] = useState<BodyView>("front");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (list: string[], set: (v: string[]) => void) => (id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const level = severityLevel(severity);
  const sevColor = SCORE_COLOR[level];

  async function save() {
    setSaving(true);
    setError(null);
    try {
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
      if (!res.ok) {
        setError(data.error ?? "Couldn't save. Please try again.");
        return;
      }
      onSaved(Array.isArray(data.newMilestones) ? data.newMilestones : []);
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const when = dayParts(date).long;
  const summary = [
    `${areas.length} area${areas.length === 1 ? "" : "s"}`,
    `${symptoms.length} symptom${symptoms.length === 1 ? "" : "s"}`,
    when,
  ].join(" · ");

  return (
    <div className="space-y-4">
      {!isToday && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-primary/50 bg-chip px-4 py-2.5">
          <p className="text-sm font-medium text-fg">
            {log ? "Editing" : "Filling in"} {formatDate(date)}
          </p>
          {onBackToToday && (
            <button type="button" onClick={onBackToToday} className="btn-ghost min-h-9 px-2 text-[13px]">
              Back to today
            </button>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        {/* Left — body map */}
        <section className="card" aria-labelledby="where-title">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <h2 id="where-title" className="card-title">
                {isToday ? "Where is it today?" : "Where was it that day?"}
              </h2>
              <p className="mt-0.5 text-meta text-fg-muted">Tap the body or the list. None is a great day.</p>
            </div>
            <SegmentedControl
              label="Body view"
              size="sm"
              value={view}
              onChange={setView}
              options={[
                { value: "front", label: "Front" },
                { value: "back", label: "Back" },
              ]}
            />
          </div>
          <BodyMap selected={areas} onToggle={toggle(areas, setAreas)} zones={zones} view={view} />
        </section>

        {/* Right — severity, symptoms, sleep & mood, notes */}
        <section className="card flex flex-col" aria-label="How it is">
          <fieldset>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <legend className="card-title float-left">How rough {isToday ? "is" : "was"} it overall?</legend>
              <p aria-live="polite" className="flex shrink-0 items-baseline gap-1 text-meta text-fg-secondary">
                <span className="font-mono text-[26px] font-semibold leading-none tabular-nums" style={{ color: sevColor }}>
                  {severity}
                </span>
                /10 · {severityWord(severity)}
              </p>
            </div>
            <div role="radiogroup" aria-label="Severity from 1 (calm) to 10 (really hard)" className="clear-both grid grid-cols-5 gap-1.5 sm:grid-cols-10">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                const on = n === severity;
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={`${n} — ${severityWord(n)}`}
                    onClick={() => setSeverity(n)}
                    className={cn(
                      "h-11 rounded-control border font-mono text-[14px] font-medium tabular-nums transition-colors duration-150 ease-out",
                      on ? "border-transparent text-ink" : "border-line text-fg-secondary hover:border-line-strong hover:text-fg"
                    )}
                    style={on ? { backgroundColor: SCORE_COLOR[severityLevel(n)] } : undefined}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-meta text-fg-muted">
              <span>Calm</span>
              <span>Managing</span>
              <span>Really hard</span>
            </div>
          </fieldset>

          <fieldset className="mt-7">
            <legend className="card-title mb-3">What&apos;s it doing?</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {symptomOptions.map((s) => {
                const on = symptoms.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(symptoms, setSymptoms)(s.id)}
                    className={cn(
                      "flex min-h-11 items-center justify-between gap-2 rounded-control border px-3.5 py-2 text-left text-sm transition-colors duration-150 ease-out",
                      on
                        ? "border-primary bg-chip text-fg-active"
                        : "border-line text-fg-secondary hover:border-line-strong hover:text-fg"
                    )}
                  >
                    <span className="min-w-0">{s.label}</span>
                    <span
                      className={cn(
                        "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border",
                        on ? "border-primary bg-primary text-white" : "border-line-strong text-transparent"
                      )}
                      aria-hidden
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <fieldset>
              <legend className="mb-2 text-[13px] font-medium text-fg-secondary">
                {isToday ? "Last night's sleep" : "Sleep that night"} <span className="text-fg-muted">optional</span>
              </legend>
              <ScaleRow labels={SLEEP} value={sleep} onChange={setSleep} name="Sleep" />
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-[13px] font-medium text-fg-secondary">
                Mood <span className="text-fg-muted">optional</span>
              </legend>
              <ScaleRow labels={MOODS} value={mood} onChange={setMood} name="Mood" />
            </fieldset>
          </div>

          <div className="mt-7">
            <label htmlFor={`note-${date}`} className="mb-2 block text-[15px] font-semibold text-fg">
              Notes <span className="text-meta font-normal text-fg-muted">optional</span>
            </label>
            <textarea
              id={`note-${date}`}
              className="input min-h-20 resize-y"
              placeholder="Anything different today — food, sleep, stress, products?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
            />
          </div>

          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}

          <div className="min-h-7 flex-1" aria-hidden />
          <div className="flex flex-col-reverse gap-3 border-t border-line-subtle pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-meta text-fg-muted">{summary}</p>
            <button onClick={save} disabled={saving} className="btn-primary min-h-11 px-5">
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {log
                ? `Update ${isToday ? "today's" : "this"} check-in`
                : isToday
                  ? "Save today's check-in"
                  : `Save ${formatDate(date)}`}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

/** 1–5 scale as a row of word buttons; tapping the chosen one clears it. */
function ScaleRow({
  labels,
  value,
  onChange,
  name,
}: {
  labels: string[];
  value: number | null;
  onChange: (v: number | null) => void;
  name: string;
}) {
  return (
    <div role="radiogroup" aria-label={`${name}, 1 to 5`} className="grid grid-cols-5 gap-1">
      {labels.map((l, i) => {
        const n = i + 1;
        const on = value === n;
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`${name} ${n} of 5: ${l}`}
            onClick={() => onChange(on ? null : n)}
            className={cn(
              "flex min-h-11 flex-col items-center justify-center rounded-control border px-0.5 text-[11.5px] leading-tight transition-colors",
              on ? "border-primary bg-chip text-fg-active" : "border-line text-fg-muted hover:border-line-strong hover:text-fg"
            )}
          >
            <span className="font-mono text-[13px] tabular-nums">{n}</span>
            <span className="truncate">{l}</span>
          </button>
        );
      })}
    </div>
  );
}
