"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Save, Trash2 } from "lucide-react";
import {
  POEM_ANSWERS,
  POEM_MAX,
  POEM_QUESTIONS,
  type PoemAnswers,
  emptyPoemAnswers,
  poemBand,
  poemComplete,
  poemScore,
} from "@/lib/poem";
import {
  type HistoryEntry,
  appendHistory,
  clearHistory,
  loadHistory,
} from "@/lib/tool-history";
import { cn } from "@/lib/utils";

const TOOL = "poem";

const toneClass: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-300",
  amber: "bg-amber-500/15 text-amber-300",
  orange: "bg-orange-500/15 text-orange-300",
  rose: "bg-rose-500/15 text-rose-300",
};

interface PoemDetail {
  answers: PoemAnswers;
  band: string;
}

export function PoemClient() {
  const [answers, setAnswers] = useState<PoemAnswers>(emptyPoemAnswers);
  const [history, setHistory] = useState<HistoryEntry<PoemDetail>[]>([]);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setHistory(loadHistory<PoemDetail>(TOOL));
  }, []);

  const score = useMemo(() => poemScore(answers), [answers]);
  const complete = poemComplete(answers);
  const band = poemBand(score);
  const answered = POEM_QUESTIONS.filter((q) => typeof answers[q.id] === "number").length;

  function setAnswer(id: string, v: number) {
    setAnswers((cur) => ({ ...cur, [id]: v }));
    setJustSaved(false);
  }

  function reset() {
    setAnswers(emptyPoemAnswers());
    setJustSaved(false);
  }

  function save() {
    const next = appendHistory<PoemDetail>(TOOL, {
      at: new Date().toISOString(),
      score,
      detail: { answers, band: band.label },
    });
    setHistory(next);
    setJustSaved(true);
  }

  function wipeHistory() {
    if (!confirm("Clear your saved POEM history on this device?")) return;
    clearHistory(TOOL);
    setHistory([]);
  }

  const recent = [...history].reverse().slice(0, 8);
  const prev = history.length >= 1 ? history[history.length - 1].score : null;
  const maxSeen = Math.max(POEM_MAX, ...history.map((h) => h.score));

  return (
    <div className="space-y-6">
      {/* Live score */}
      <div className="card !rounded-3xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">
              This week&apos;s POEM {complete ? "" : `· ${answered}/7 answered`}
            </p>
            <p className="mt-1 text-5xl font-extrabold tabular-nums text-white">
              {score}
              <span className="text-xl font-medium text-slate-500"> / {POEM_MAX}</span>
            </p>
            <span className={cn("badge mt-3", toneClass[band.tone])}>{band.label}</span>
            <p className="mt-2 max-w-md text-sm text-slate-400">{band.blurb}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={reset} className="btn-secondary">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button onClick={save} disabled={!complete} className="btn-primary">
              <Save className="h-4 w-4" /> {justSaved ? "Saved ✓" : "Save week"}
            </button>
          </div>
        </div>
        {!complete && (
          <p className="mt-4 text-xs text-slate-500">
            Answer all seven to save this week&apos;s score.
          </p>
        )}
      </div>

      {/* Questions */}
      <div className="card !rounded-3xl">
        <p className="text-sm font-medium text-slate-300">
          Over the last week, on how many days has…
        </p>
        <div className="mt-4 space-y-5">
          {POEM_QUESTIONS.map((q, i) => (
            <div key={q.id} className="border-b border-lab-border pb-5 last:border-0 last:pb-0">
              <p className="text-sm text-white">
                <span className="mr-2 text-slate-500">{i + 1}.</span>
                {q.text}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {POEM_ANSWERS.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setAnswer(q.id, a.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                      answers[q.id] === a.value
                        ? "border-brand-500 bg-brand-500/20 text-brand-100"
                        : "border-lab-border text-slate-400 hover:border-brand-600/60 hover:text-slate-200"
                    )}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History + trend */}
      {recent.length > 0 && (
        <div className="card !rounded-3xl">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Your weekly trend</h2>
            <button onClick={wipeHistory} className="text-xs text-slate-500 hover:text-rose-400">
              <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Clear
            </button>
          </div>
          {prev != null && complete && (
            <p className="mt-1 text-sm text-slate-400">
              Last saved week: <span className="font-semibold text-white">{prev}</span>
              {" · "}
              {score < prev ? "improving 🌿" : score > prev ? "flarier this week" : "holding steady"}
            </p>
          )}

          {/* Simple inline bar trend — oldest to newest, no chart lib needed. */}
          <div className="mt-4 flex items-end gap-1.5">
            {history.slice(-16).map((e) => {
              const eb = poemBand(e.score);
              const h = Math.max(6, Math.round((e.score / maxSeen) * 96));
              const barTone: Record<string, string> = {
                emerald: "bg-emerald-500/70",
                amber: "bg-amber-500/70",
                orange: "bg-orange-500/70",
                rose: "bg-rose-500/70",
              };
              return (
                <div
                  key={e.at}
                  title={`${new Date(e.at).toLocaleDateString("en-GB")} · ${e.score}/28`}
                  className={cn("flex-1 rounded-t", barTone[eb.tone])}
                  style={{ height: `${h}px` }}
                />
              );
            })}
          </div>

          <ul className="mt-5 space-y-2">
            {recent.map((e) => {
              const eb = poemBand(e.score);
              return (
                <li
                  key={e.at}
                  className="flex items-center justify-between rounded-xl border border-lab-border bg-lab-bg px-4 py-2.5 text-sm"
                >
                  <span className="text-slate-400">
                    {new Date(e.at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className={cn("badge", toneClass[eb.tone])}>{eb.label}</span>
                    <span className="font-semibold tabular-nums text-white">{e.score}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Saved on this device only — private, never uploaded.
          </p>
        </div>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        POEM is an educational self-assessment tool, not a diagnosis. It&apos;s a simple way to see
        whether your week was better or worse than the last — and a useful thing to show a
        clinician.
      </p>
    </div>
  );
}
