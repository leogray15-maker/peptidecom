"use client";

import { useState } from "react";
import { ChevronDown, Leaf, ShieldAlert, Sparkles, Utensils } from "lucide-react";
import type { AdditiveRisk, FoodAnalysis, NutrientFinding } from "@/lib/food-score";
import type { ScannedProduct, ScoreTone } from "@/lib/product-score";
import { ScoreRing, TONE_TEXT } from "@/components/score-ring";
import { cn } from "@/lib/utils";

const dotBg: Record<ScoreTone, string> = {
  emerald: "bg-emerald-400",
  green: "bg-lime-400",
  orange: "bg-orange-400",
  rose: "bg-rose-500",
};

const riskTone: Record<AdditiveRisk, ScoreTone> = {
  none: "emerald",
  limited: "green",
  moderate: "orange",
  high: "rose",
};

const riskLabel: Record<AdditiveRisk, string> = {
  none: "No known risk",
  limited: "Limited risk",
  moderate: "Moderate risk",
  high: "Higher risk",
};

function fmt(value: number | null, unit: string): string {
  if (value == null) return "—";
  const rounded = Number.isInteger(value) ? value : Math.round(value * 10) / 10;
  return unit === "%" ? `${rounded}%` : `${rounded} ${unit}`;
}

function NutrientRow({ f }: { f: NutrientFinding }) {
  return (
    <li className="flex items-center gap-3 border-b border-lab-border py-3 last:border-0">
      <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", dotBg[f.tone])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{f.label}</p>
        <p className="text-xs text-slate-500">{f.note}</p>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-200">
        {fmt(f.value, f.unit)}
      </span>
    </li>
  );
}

export function FoodResult({
  product,
  analysis,
}: {
  product: ScannedProduct;
  analysis: FoodAnalysis;
}) {
  const [showAdditives, setShowAdditives] = useState(false);
  const { band } = analysis;

  const worstRisk: AdditiveRisk = analysis.additives.reduce<AdditiveRisk>((worst, a) => {
    const order: AdditiveRisk[] = ["none", "limited", "moderate", "high"];
    return order.indexOf(a.risk) > order.indexOf(worst) ? a.risk : worst;
  }, "none");

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
              <Utensils className="h-7 w-7" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-white">
              {product.name ?? "Unnamed product"}
            </p>
            {product.brand && <p className="truncate text-sm text-slate-400">{product.brand}</p>}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {analysis.nutriscoreGrade && (
                <span className="rounded-md bg-lab-bg px-1.5 py-0.5 text-[11px] font-semibold uppercase text-slate-300">
                  Nutri-Score {analysis.nutriscoreGrade.toUpperCase()}
                </span>
              )}
              {analysis.novaGroup && (
                <span className="rounded-md bg-lab-bg px-1.5 py-0.5 text-[11px] text-slate-400">
                  NOVA {analysis.novaGroup}
                </span>
              )}
              {analysis.organic && (
                <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] text-emerald-300">
                  Organic
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4 border-t border-lab-border pt-5">
          <ScoreRing score={analysis.score} tone={band.tone} />
          <div>
            <p className={cn("text-lg font-bold", TONE_TEXT[band.tone])}>{band.label}</p>
            <p className="mt-1 text-sm text-slate-400">{band.blurb}</p>
            <p className="mt-2 text-xs text-slate-500">Nutrition score · per 100 g / ml</p>
          </div>
        </div>
      </div>

      {/* Negatives */}
      {(analysis.negatives.length > 0 || analysis.additives.length > 0) && (
        <div className="card !rounded-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-300" />
              <h2 className="font-semibold text-white">Negatives</h2>
            </div>
            <span className="text-xs text-slate-500">per 100 g</span>
          </div>
          <ul className="mt-2">
            {/* Additives row (expandable) */}
            {analysis.additives.length > 0 && (
              <li className="border-b border-lab-border py-3">
                <button
                  onClick={() => setShowAdditives((v) => !v)}
                  className="flex w-full items-center gap-3"
                >
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", dotBg[riskTone[worstRisk]])} />
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-medium text-white">Additives</p>
                    <p className="text-xs text-slate-500">
                      {worstRisk === "none" ? "None to avoid" : `Contains ${riskLabel[worstRisk].toLowerCase()} additives`}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-200">
                    {analysis.additiveCount}
                  </span>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-500 transition", showAdditives && "rotate-180")} />
                </button>
                {showAdditives && (
                  <ul className="mt-3 space-y-2 pl-5">
                    {analysis.additives.map((a) => (
                      <li key={a.code} className="flex items-center gap-2 text-sm">
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", dotBg[riskTone[a.risk]])} />
                        <span className="font-medium text-slate-200">{a.code}</span>
                        <span className="min-w-0 flex-1 truncate text-slate-400">{a.name}</span>
                        <span className="shrink-0 text-xs text-slate-500">{riskLabel[a.risk]}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )}
            {analysis.negatives.map((f) => (
              <NutrientRow key={f.id} f={f} />
            ))}
          </ul>
        </div>
      )}

      {/* Positives */}
      {analysis.positives.length > 0 && (
        <div className="card !rounded-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-emerald-300" />
              <h2 className="font-semibold text-white">Positives</h2>
            </div>
            <span className="text-xs text-slate-500">per 100 g</span>
          </div>
          <ul className="mt-2">
            {analysis.positives.map((f) => (
              <NutrientRow key={f.id} f={f} />
            ))}
          </ul>
        </div>
      )}

      {/* Ingredients (foods list them too) */}
      {product.ingredientsText && (
        <div className="card !rounded-3xl">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-300" />
            <h2 className="font-semibold text-white">Ingredients</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">{product.ingredientsText}</p>
        </div>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        Educational nutrition score based on the Nutri-Score, front-of-pack traffic-light
        thresholds and additive risk ratings — not dietary or medical advice. Product data from
        Open Food Facts &amp; Open Products Facts (community databases, so values can be incomplete
        or out of date — always check the pack).
      </p>
    </div>
  );
}
