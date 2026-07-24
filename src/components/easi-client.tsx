"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Save, Trash2 } from "lucide-react";
import {
  type EasiInput,
  EASI_AREA_BANDS,
  EASI_MAX,
  EASI_REGIONS,
  EASI_SIGNS,
  EASI_SIGN_BANDS,
  type EasiSignId,
  easiBand,
  easiScore,
  emptyEasiInput,
  regionScore,
} from "@/lib/easi";
import {
  type HistoryEntry,
  appendHistory,
  clearHistory,
  loadHistory,
} from "@/lib/tool-history";
import { cn } from "@/lib/utils";

const TOOL = "easi";

const toneClass: Record<string, string> = {
  emerald: "bg-emerald-500/15 text-emerald-300",
  amber: "bg-amber-500/15 text-amber-300",
  orange: "bg-orange-500/15 text-orange-300",
  rose: "bg-rose-500/15 text-rose-300",
};

interface EasiDetail {
  input: EasiInput;
  band: string;
}

/** Compact pill row for a small integer scale. */
function ScaleRow({
  value,
  onChange,
  options,
}: {
  value: number;
  onChange: (v: number) => void;
  options: { value: number; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
            value === o.value
              ? "border-brand-500 bg-brand-500/20 text-brand-100"
              : "border-lab-border text-slate-400 hover:border-brand-600/60 hover:text-slate-200"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EasiClient() {
  const [input, setInput] = useState<EasiInput>(emptyEasiInput);
  const [history, setHistory] = useState<HistoryEntry<EasiDetail>[]>([]);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setHistory(loadHistory<EasiDetail>(TOOL));
  }, []);

  const score = useMemo(() => easiScore(input), [input]);
  const band = easiBand(score);

  function setArea(region: keyof EasiInput, area: number) {
    setInput((cur) => ({ ...cur, [region]: { ...cur[region], area } }));
  }
  function setSign(region: keyof EasiInput, sign: EasiSignId, v: number) {
    setInput((cur) => ({
      ...cur,
      [region]: { ...cur[region], signs: { ...cur[region].signs, [sign]: v } },
    }));
  }

  function reset() {
    setInput(emptyEasiInput());
    setJustSaved(false);
  }

  function save() {
    const next = appendHistory<EasiDetail>(TOOL, {
      at: new Date().toISOString(),
      score,
      detail: { input, band: band.label },
    });
    setHistory(next);
    setJustSaved(true);
  }

  function wipeHistory() {
    if (!confirm("Clear your saved EASI history on this device?")) return;
    clearHistory(TOOL);
    setHistory([]);
  }

  const recent = [...history].reverse().slice(0, 8);
  const prev = history.length >= 2 ? history[history.length - 1].score : null;

  return (
    <div className="space-y-6">
      {/* Live score */}
      <div className="card !rounded-3xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Your EASI score</p>
            <p className="mt-1 text-5xl font-extrabold tabular-nums text-white">
              {score.toFixed(1)}
              <span className="text-xl font-medium text-slate-500"> / {EASI_MAX}</span>
            </p>
            <span className={cn("badge mt-3", toneClass[band.tone])}>{band.label}</span>
            <p className="mt-2 max-w-md text-sm text-slate-400">{band.blurb}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={reset} className="btn-secondary">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button onClick={save} className="btn-primary">
              <Save className="h-4 w-4" /> {justSaved ? "Saved ✓" : "Save score"}
            </button>
          </div>
        </div>
      </div>

      {/* Regions */}
      {EASI_REGIONS.map((region) => {
        const ri = input[region.id];
        const contribution = regionScore(region, ri);
        return (
          <div key={region.id} className="card !rounded-3xl">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">{region.label}</h2>
              <span className="text-xs text-slate-500 tabular-nums">
                +{Math.round(contribution * 10) / 10} to total
              </span>
            </div>

            <div className="mt-4">
              <p className="label">Area affected</p>
              <ScaleRow
                value={ri.area}
                onChange={(v) => setArea(region.id, v)}
                options={EASI_AREA_BANDS}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {EASI_SIGNS.map((sign) => (
                <div key={sign.id}>
                  <p className="label" title={sign.hint}>
                    {sign.label}
                    <span className="ml-1 font-normal text-slate-600">· {sign.hint.split(" — ")[0]}</span>
                  </p>
                  <ScaleRow
                    value={ri.signs[sign.id]}
                    onChange={(v) => setSign(region.id, sign.id, v)}
                    options={EASI_SIGN_BANDS}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* History */}
      {recent.length > 0 && (
        <div className="card !rounded-3xl">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Your saved scores</h2>
            <button onClick={wipeHistory} className="text-xs text-slate-500 hover:text-rose-400">
              <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Clear
            </button>
          </div>
          {prev != null && (
            <p className="mt-1 text-sm text-slate-400">
              Latest saved: <span className="font-semibold text-white">{prev.toFixed(1)}</span>
              {" · "}
              {score > prev ? "up" : score < prev ? "down" : "level"} vs the score above.
            </p>
          )}
          <ul className="mt-4 space-y-2">
            {recent.map((e) => {
              const eb = easiBand(e.score);
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
                    <span className="font-semibold tabular-nums text-white">{e.score.toFixed(1)}</span>
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
        The EASI is an educational self-assessment aid, not a diagnosis. Scores you calculate
        here are a way to track change and start a conversation with a clinician — they don&apos;t
        replace one.
      </p>
    </div>
  );
}
