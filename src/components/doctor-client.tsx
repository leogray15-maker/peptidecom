"use client";

import { useMemo, useState } from "react";
import { Plus, Printer, X } from "lucide-react";
import {
  type DailyLog,
  SYMPTOMS,
  dateKey,
  daysBetween,
  zoneLabel,
} from "@/lib/tsw";
import type { TriggerItem } from "@/components/triggers-client";
import { cn, formatDate } from "@/lib/utils";

const SUGGESTED_QUESTIONS = [
  "I believe I may be experiencing topical steroid withdrawal — can we discuss that possibility openly?",
  "Given my symptom history, what would you rule out before settling on a diagnosis?",
  "Are there non-steroid options we could consider for managing my worst symptoms?",
  "What symptoms would you want me to come back in urgently for?",
  "Is there anything in my routine (moisturisers, bathing, diet) you'd change first?",
  "Could we make a plan for sleep? The itch is badly affecting mine.",
  "Would a referral to a dermatologist experienced with steroid withdrawal be possible?",
  "How should we monitor for skin infections while my barrier is damaged?",
];

export function DoctorClient({
  logs,
  triggers,
  userName,
}: {
  logs: DailyLog[];
  triggers: TriggerItem[];
  userName: string | null;
}) {
  const [selected, setSelected] = useState<string[]>(SUGGESTED_QUESTIONS.slice(0, 3));
  const [custom, setCustom] = useState("");

  const today = dateKey();
  const recent = useMemo(
    () =>
      logs
        .filter((l) => daysBetween(l.date, today) < 30)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [logs, today]
  );

  const summary = useMemo(() => {
    if (recent.length === 0) return null;
    const avg =
      Math.round((recent.reduce((s, l) => s + l.severity, 0) / recent.length) * 10) / 10;
    const worst = recent.reduce((w, l) => (l.severity > w.severity ? l : w), recent[0]);
    const areas = new Map<string, number>();
    const symptoms = new Map<string, number>();
    for (const l of recent) {
      for (const a of l.areas) areas.set(a, (areas.get(a) ?? 0) + 1);
      for (const s of l.symptoms) symptoms.set(s, (symptoms.get(s) ?? 0) + 1);
    }
    const sleepLogs = recent.filter((l) => l.sleep != null);
    const avgSleep =
      sleepLogs.length > 0
        ? Math.round((sleepLogs.reduce((s, l) => s + (l.sleep as number), 0) / sleepLogs.length) * 10) / 10
        : null;
    return {
      from: recent[0].date,
      to: recent[recent.length - 1].date,
      daysLogged: recent.length,
      avg,
      worst,
      areas: [...areas.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
      symptoms: [...symptoms.entries()].sort((a, b) => b[1] - a[1]),
      avgSleep,
      badDays: recent.filter((l) => l.severity >= 7).length,
    };
  }, [recent]);

  const flaggedTriggers = useMemo(
    () => triggers.filter((t) => t.effect === -1).slice(0, 8),
    [triggers]
  );

  function toggle(q: string) {
    setSelected((cur) => (cur.includes(q) ? cur.filter((x) => x !== q) : [...cur, q]));
  }

  function addCustom() {
    const q = custom.trim();
    if (!q) return;
    setSelected((cur) => [...cur, q]);
    setCustom("");
  }

  return (
    <div className="space-y-6">
      <div className="card border-brand-500/30 bg-brand-950/20 no-print">
        <p className="text-sm leading-relaxed text-slate-300">
          A doctor who listens is one of the strongest cards you can hold — and appointments go
          better when you arrive with data instead of memories. This builds a one-page summary
          from your tracker plus the questions you actually want answered.
        </p>
      </div>

      {/* Question builder */}
      <div className="card no-print">
        <p className="font-semibold text-white">Build your question list</p>
        <p className="mt-0.5 text-sm text-slate-500">Tap to add or remove. Aim for 3–6 — the ones that matter most.</p>
        <div className="mt-4 space-y-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => toggle(q)}
              className={cn(
                "block w-full rounded-xl border px-4 py-2.5 text-left text-sm transition",
                selected.includes(q)
                  ? "border-brand-500 bg-brand-500/15 text-brand-100"
                  : "border-lab-border text-slate-400 hover:border-brand-700 hover:text-slate-200"
              )}
            >
              {q}
            </button>
          ))}
          {selected
            .filter((q) => !SUGGESTED_QUESTIONS.includes(q))
            .map((q) => (
              <div key={q} className="flex items-center justify-between rounded-xl border border-brand-500 bg-brand-500/15 px-4 py-2.5 text-sm text-brand-100">
                <span>{q}</span>
                <button onClick={() => toggle(q)} aria-label="Remove question" className="ml-3 text-brand-300 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            className="input"
            placeholder="Add your own question…"
            value={custom}
            maxLength={300}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
          />
          <button onClick={addCustom} className="btn-secondary shrink-0">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>

      <div className="flex justify-end no-print">
        <button onClick={() => window.print()} className="btn-primary">
          <Printer className="h-4 w-4" /> Print / save as PDF
        </button>
      </div>

      {/* Printable summary — styled for screen, restyled by print CSS */}
      <div className="card print-sheet">
        <h2 className="text-lg font-bold text-white">
          Symptom summary{userName ? ` — ${userName}` : ""}
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Self-tracked daily log, prepared for a medical appointment · generated {formatDate(new Date())}
        </p>

        {summary ? (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Period</p>
                <p className="mt-1 text-sm font-medium text-slate-200">
                  {formatDate(summary.from)} – {formatDate(summary.to)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Days logged</p>
                <p className="mt-1 text-sm font-medium text-slate-200">{summary.daysLogged}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Avg severity</p>
                <p className="mt-1 text-sm font-medium text-slate-200">{summary.avg}/10</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Severe days (≥7)</p>
                <p className="mt-1 text-sm font-medium text-slate-200">{summary.badDays}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-white">Most affected areas</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {summary.areas.map(([a, c]) => (
                    <li key={a}>{zoneLabel(a)} — {c} of {summary.daysLogged} days</li>
                  ))}
                  {summary.areas.length === 0 && <li className="text-slate-500">None recorded</li>}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Symptoms recorded</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {summary.symptoms.map(([s, c]) => (
                    <li key={s}>{SYMPTOMS.find((x) => x.id === s)?.label ?? s} — {c} days</li>
                  ))}
                  {summary.symptoms.length === 0 && <li className="text-slate-500">None recorded</li>}
                </ul>
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-white">Worst recent day</p>
                <p className="mt-2 text-sm text-slate-300">
                  {formatDate(summary.worst.date)} — severity {summary.worst.severity}/10
                  {summary.worst.note ? ` · "${summary.worst.note}"` : ""}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Sleep</p>
                <p className="mt-2 text-sm text-slate-300">
                  {summary.avgSleep != null
                    ? `Average self-rated sleep quality ${summary.avgSleep}/5 over ${summary.daysLogged} days`
                    : "Not tracked this period"}
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            No tracker data in the last 30 days — the summary fills itself in once you&apos;ve logged
            a few days. The question list below still prints.
          </p>
        )}

        {flaggedTriggers.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-semibold text-white">Suspected triggers (self-observed)</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              {flaggedTriggers.map((t) => (
                <li key={t.id}>{t.name} ({formatDate(t.date)}){t.note ? ` — ${t.note}` : ""}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5">
          <p className="text-sm font-semibold text-white">Questions I&apos;d like to cover</p>
          {selected.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No questions selected yet.</p>
          ) : (
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-300">
              {selected.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          )}
        </div>

        <p className="mt-6 border-t border-lab-border pt-3 text-xs text-slate-500">
          Data is self-reported by the patient via a daily tracking app (severity is a subjective
          1–10 scale). Prepared to support — not replace — clinical assessment.
        </p>
      </div>
    </div>
  );
}
