"use client";

import { useState } from "react";
import { ChevronDown, Leaf, ShieldAlert, Sparkles } from "lucide-react";
import { type ProductAnalysis, type ScannedProduct } from "@/lib/product-score";
import { CATEGORY_LABEL } from "@/lib/irritants";
import { ScoreRing, TONE_TEXT } from "@/components/score-ring";
import { cn } from "@/lib/utils";

const toneText = TONE_TEXT;

const severityDot: Record<1 | 2 | 3, string> = {
  1: "bg-amber-400",
  2: "bg-orange-400",
  3: "bg-rose-500",
};

const zoneLabel: Record<string, string> = {
  top: "high in the list",
  mid: "mid-list",
  base: "low in the list",
};

export function ProductResult({
  product,
  analysis,
}: {
  product: ScannedProduct;
  analysis: ProductAnalysis;
}) {
  const [showAll, setShowAll] = useState(false);
  const { band } = analysis;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="card !rounded-3xl">
        <div className="flex items-center gap-4">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name ?? "Product"}
              className="h-20 w-20 shrink-0 rounded-2xl bg-white/5 object-contain p-1"
            />
          ) : (
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-brand-500/10 text-brand-300">
              <Sparkles className="h-7 w-7" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-white">
              {product.name ?? "Unnamed product"}
            </p>
            {product.brand && <p className="truncate text-sm text-slate-400">{product.brand}</p>}
            {product.code && (
              <p className="mt-0.5 font-mono text-[11px] text-slate-600">#{product.code}</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4 border-t border-lab-border pt-5">
          <ScoreRing score={analysis.score} tone={band.tone} />
          <div>
            <p className={cn("text-lg font-bold", toneText[band.tone])}>{band.label}</p>
            <p className="mt-1 text-sm text-slate-400">{band.blurb}</p>
            <p className="mt-2 text-xs text-slate-500">
              {analysis.ingredientCount} ingredients · {analysis.negatives.length} flagged ·{" "}
              {analysis.positives.length} skin-friendly
            </p>
          </div>
        </div>
      </div>

      {/* Negatives */}
      {analysis.negatives.length > 0 && (
        <div className="card !rounded-3xl">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-300" />
            <h2 className="font-semibold text-white">Negatives</h2>
            <span className="text-xs text-slate-500">for sensitive skin</span>
          </div>
          <ul className="mt-4 space-y-3">
            {analysis.negatives.map((n) => (
              <li key={n.name} className="border-b border-lab-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", severityDot[n.severity])} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <p className="font-medium text-white">{n.name}</p>
                      <span className="rounded-full bg-lab-bg px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                        {CATEGORY_LABEL[n.category]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-400">{n.why}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Found: {n.hits.join(", ")}
                      {n.zone && <> · {zoneLabel[n.zone]}</>}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Positives */}
      {analysis.positives.length > 0 && (
        <div className="card !rounded-3xl">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-emerald-300" />
            <h2 className="font-semibold text-white">Positives</h2>
            <span className="text-xs text-slate-500">barrier-friendly</span>
          </div>
          <ul className="mt-4 space-y-3">
            {analysis.positives.map((p) => (
              <li key={p.name} className="border-b border-lab-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{p.name}</p>
                    <p className="mt-0.5 text-sm text-slate-400">{p.why}</p>
                    <p className="mt-1 text-xs text-slate-500">Found: {p.hits.join(", ")}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.negatives.length === 0 && analysis.positives.length === 0 && (
        <div className="card !rounded-3xl text-sm text-slate-400">
          None of this product&apos;s ingredients matched our watch list or our skin-friendly list.
          That often means a simple formula — but always patch-test something new.
        </div>
      )}

      {/* Full breakdown */}
      {analysis.breakdown.length > 0 && (
        <div className="card !rounded-3xl">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="flex w-full items-center justify-between"
          >
            <h2 className="font-semibold text-white">All {analysis.ingredientCount} ingredients</h2>
            <ChevronDown className={cn("h-5 w-5 text-slate-500 transition", showAll && "rotate-180")} />
          </button>
          {showAll && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {analysis.breakdown.map((item, i) => (
                <span
                  key={`${item.name}-${i}`}
                  className={cn(
                    "rounded-lg px-2 py-1 text-xs",
                    item.tag === "flag" && "bg-rose-500/15 text-rose-200",
                    item.tag === "good" && "bg-emerald-500/15 text-emerald-200",
                    item.tag === "neutral" && "bg-lab-bg text-slate-400"
                  )}
                >
                  {item.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        Educational score for sensitive / eczema-prone skin — not a safety verdict or medical
        advice. Product data from Open Beauty Facts &amp; Open Food Facts (community databases, so
        ingredient lists can be incomplete or out of date — always check the pack). A flag isn&apos;t
        a ban; many people tolerate these ingredients fine.
      </p>
    </div>
  );
}
