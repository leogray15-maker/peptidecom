"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ScanLine, Sparkles } from "lucide-react";
import {
  CATEGORY_LABEL,
  type IrritantCategory,
  scanIngredients,
} from "@/lib/irritants";
import { cn } from "@/lib/utils";

const EXAMPLE =
  "Aqua, Glycerin, Cetearyl Alcohol, Parfum, Linalool, Limonene, Sodium Lauryl Sulfate, Methylisothiazolinone, Lavandula Angustifolia Oil, Phenoxyethanol";

const categoryTone: Record<IrritantCategory, string> = {
  fragrance: "text-rose-300",
  preservative: "text-orange-300",
  surfactant: "text-amber-300",
  alcohol: "text-amber-300",
  botanical: "text-emerald-300",
  other: "text-slate-300",
};

export function ScanClient() {
  const [text, setText] = useState("");
  const [scanned, setScanned] = useState<string | null>(null);

  const result = useMemo(() => (scanned ? scanIngredients(scanned) : null), [scanned]);

  const grouped = useMemo(() => {
    if (!result) return [];
    const map = new Map<IrritantCategory, typeof result.matches>();
    for (const m of result.matches) {
      map.set(m.irritant.category, [...(map.get(m.irritant.category) ?? []), m]);
    }
    return [...map.entries()];
  }, [result]);

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="card !rounded-3xl">
        <label className="label" htmlFor="ingredients">
          Ingredient list
        </label>
        <textarea
          id="ingredients"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Copy the ingredients from the back of the pack and paste them here…"
          className="input min-h-[120px] resize-y"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setScanned(text)}
            disabled={text.trim().length === 0}
            className="btn-primary"
          >
            <ScanLine className="h-4 w-4" /> Scan ingredients
          </button>
          <button
            onClick={() => {
              setText(EXAMPLE);
              setScanned(EXAMPLE);
            }}
            className="btn-secondary"
          >
            <Sparkles className="h-4 w-4" /> Try an example
          </button>
          {(text || scanned) && (
            <button
              onClick={() => {
                setText("");
                setScanned(null);
              }}
              className="btn-ghost"
            >
              Clear
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Runs entirely on your device — the ingredient list never leaves your phone.
        </p>
      </div>

      {/* Results */}
      {result && (
        <>
          <div
            className={cn(
              "card !rounded-3xl flex items-start gap-4",
              result.matches.length === 0
                ? "border-emerald-500/30"
                : "border-amber-500/30"
            )}
          >
            <div
              className={cn(
                "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
                result.matches.length === 0
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-amber-500/15 text-amber-300"
              )}
            >
              {result.matches.length === 0 ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <AlertTriangle className="h-6 w-6" />
              )}
            </div>
            <div>
              <p className="font-semibold text-white">
                {result.matches.length === 0
                  ? "No common irritants flagged"
                  : `${result.matches.length} thing${result.matches.length === 1 ? "" : "s"} worth a look`}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Scanned {result.ingredientCount} ingredient
                {result.ingredientCount === 1 ? "" : "s"} · {result.cleanCount} not on the watch
                list.
                {result.matches.length > 0 &&
                  " A flag isn't a verdict — plenty of people tolerate these. It's a prompt to patch-test or watch how your skin responds."}
              </p>
            </div>
          </div>

          {grouped.map(([category, matches]) => (
            <div key={category} className="card !rounded-3xl">
              <h2 className={cn("text-sm font-semibold uppercase tracking-wide", categoryTone[category])}>
                {CATEGORY_LABEL[category]}
              </h2>
              <ul className="mt-3 space-y-3">
                {matches.map((m) => (
                  <li key={m.irritant.name} className="border-b border-lab-border pb-3 last:border-0 last:pb-0">
                    <p className="font-medium text-white">{m.irritant.name}</p>
                    <p className="mt-0.5 text-sm text-slate-400">{m.irritant.why}</p>
                    <p className="mt-1.5 text-xs text-slate-500">
                      Matched:{" "}
                      {m.hits.map((h, i) => (
                        <span key={h}>
                          <span className="rounded bg-lab-bg px-1.5 py-0.5 text-slate-300">{h}</span>
                          {i < m.hits.length - 1 ? " " : ""}
                        </span>
                      ))}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        Educational, general information — not personalised medical or allergy advice. The watch
        list draws on the American Contact Dermatitis Society core-allergen series, the EU
        fragrance-allergen list and National Eczema Association guidance. Your own patch test and
        your clinician always win.
      </p>
    </div>
  );
}
