// Food scoring — the nutrition side of the scanner (Yuka-style, for foods).
//
// Cosmetics are scored for skin suitability (product-score.ts). Foods are scored
// on nutrition instead: a 0–100 score with Excellent/Good/Poor/Bad bands, a
// "Negatives per 100 g" list (energy, saturated fat, sugars, salt, additives)
// and a "Positives per 100 g" list (protein, fibre, fruit/veg) — mirroring what
// a food scanner shows.
//
// Pure and dependency-free (Node-testable, safe on the client). No network.
// Educational only — not dietary advice.

import type { Nutriments, ScannedProduct } from "@/lib/product-score";
import type { ScoreBand, ScoreTone } from "@/lib/product-score";

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// ─── Band (shared thresholds with the skin score) ───────────────────────────

export function foodBand(score: number): ScoreBand {
  if (score >= 75)
    return { label: "Excellent", tone: "emerald", blurb: "A nutritious choice." };
  if (score >= 50)
    return { label: "Good", tone: "green", blurb: "A decent choice — a couple of things to watch." };
  if (score >= 25)
    return { label: "Poor", tone: "orange", blurb: "Okay in moderation — several nutrition flags." };
  return { label: "Bad", tone: "rose", blurb: "Best kept as an occasional treat." };
}

// ─── Nutrient traffic-lights (per 100 g, UK FSA / Nutri-Score style) ─────────

export type Level = "good" | "moderate" | "bad";

const LEVEL_TONE: Record<Level, ScoreTone> = {
  good: "emerald",
  moderate: "orange",
  bad: "rose",
};

export interface NutrientFinding {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  level: Level;
  tone: ScoreTone;
  note: string;
}

/** Rising nutrient (more is worse): salt, sugar, sat fat, energy. */
function risingLevel(value: number, lowMax: number, midMax: number): Level {
  if (value <= lowMax) return "good";
  if (value <= midMax) return "moderate";
  return "bad";
}

/** Falling nutrient (more is better): protein, fibre, fruit/veg. */
function fallingLevel(value: number, goodMin: number, midMin: number): Level {
  if (value >= goodMin) return "good";
  if (value >= midMin) return "moderate";
  return "bad";
}

function finding(
  id: string,
  label: string,
  value: number | null,
  unit: string,
  level: Level,
  note: string
): NutrientFinding {
  return { id, label, value, unit, level, tone: LEVEL_TONE[level], note };
}

const NOTE: Record<Level, Record<"neg" | "pos", string>> = {
  good: { neg: "Low", pos: "Good amount" },
  moderate: { neg: "Moderate", pos: "Some" },
  bad: { neg: "High", pos: "Little" },
};

// ─── Additive risk (curated; unknown additives default to "limited") ─────────

export type AdditiveRisk = "none" | "limited" | "moderate" | "high";

interface AdditiveInfo {
  name: string;
  risk: AdditiveRisk;
}

const ADDITIVES: Record<string, AdditiveInfo> = {
  // High-risk / commonly flagged
  e102: { name: "Tartrazine (colour)", risk: "high" },
  e104: { name: "Quinoline yellow (colour)", risk: "high" },
  e110: { name: "Sunset yellow (colour)", risk: "high" },
  e122: { name: "Carmoisine (colour)", risk: "high" },
  e124: { name: "Ponceau 4R (colour)", risk: "high" },
  e129: { name: "Allura red (colour)", risk: "high" },
  e131: { name: "Patent blue (colour)", risk: "moderate" },
  e150c: { name: "Ammonia caramel", risk: "moderate" },
  e150d: { name: "Sulphite ammonia caramel", risk: "moderate" },
  e171: { name: "Titanium dioxide", risk: "high" },
  e211: { name: "Sodium benzoate", risk: "moderate" },
  e220: { name: "Sulphur dioxide", risk: "moderate" },
  e221: { name: "Sodium sulphite", risk: "moderate" },
  e223: { name: "Sodium metabisulphite", risk: "moderate" },
  e249: { name: "Potassium nitrite", risk: "high" },
  e250: { name: "Sodium nitrite", risk: "high" },
  e251: { name: "Sodium nitrate", risk: "high" },
  e320: { name: "BHA (antioxidant)", risk: "high" },
  e321: { name: "BHT (antioxidant)", risk: "high" },
  e407: { name: "Carrageenan", risk: "moderate" },
  e621: { name: "Monosodium glutamate (MSG)", risk: "moderate" },
  e627: { name: "Disodium guanylate", risk: "limited" },
  e631: { name: "Disodium inosinate", risk: "limited" },
  e951: { name: "Aspartame (sweetener)", risk: "high" },
  e950: { name: "Acesulfame K (sweetener)", risk: "moderate" },
  e952: { name: "Cyclamate (sweetener)", risk: "moderate" },
  e954: { name: "Saccharin (sweetener)", risk: "moderate" },
  e955: { name: "Sucralose (sweetener)", risk: "moderate" },
  // Low / no risk (still listed so the count is honest)
  e330: { name: "Citric acid", risk: "none" },
  e300: { name: "Ascorbic acid (vitamin C)", risk: "none" },
  e322: { name: "Lecithins", risk: "none" },
  e440: { name: "Pectin", risk: "none" },
  e412: { name: "Guar gum", risk: "limited" },
  e415: { name: "Xanthan gum", risk: "none" },
  e202: { name: "Potassium sorbate", risk: "limited" },
  e296: { name: "Malic acid", risk: "none" },
  e500: { name: "Sodium carbonates", risk: "none" },
};

export interface AdditiveFinding {
  code: string; // "E330"
  name: string;
  risk: AdditiveRisk;
}

const RISK_PENALTY: Record<AdditiveRisk, number> = {
  none: 0,
  limited: 2,
  moderate: 5,
  high: 9,
};

function additiveInfo(code: string): AdditiveInfo {
  return ADDITIVES[code] ?? { name: "Additive", risk: "limited" };
}

// ─── Analysis ────────────────────────────────────────────────────────────────

export interface FoodAnalysis {
  score: number;
  band: ScoreBand;
  negatives: NutrientFinding[];
  positives: NutrientFinding[];
  additives: AdditiveFinding[];
  additiveCount: number;
  nutriscoreGrade: string | null;
  novaGroup: number | null;
  organic: boolean;
  /** True when there was enough data to score. */
  hasData: boolean;
}

/** Base score from a Nutri-Score letter (approximate mapping to 0–100). */
const NUTRISCORE_BASE: Record<string, number> = {
  a: 90,
  b: 72,
  c: 52,
  d: 32,
  e: 14,
};

/** Fallback base from traffic-lights when there's no Nutri-Score. */
function baseFromNutriments(n: Nutriments): number | null {
  const anyKnown =
    n.saturatedFat != null || n.sugars != null || n.salt != null || n.energyKcal != null;
  if (!anyKnown) return null;
  let score = 90;
  if (n.saturatedFat != null) score -= risingPoints(n.saturatedFat, 1.5, 5, 12, 22);
  if (n.sugars != null) score -= risingPoints(n.sugars, 5, 22.5, 12, 22);
  if (n.salt != null) score -= risingPoints(n.salt, 0.3, 1.5, 10, 18);
  if (n.energyKcal != null) score -= risingPoints(n.energyKcal, 150, 350, 4, 10);
  if (n.proteins != null && n.proteins >= 8) score += 6;
  if (n.fiber != null && n.fiber >= 3) score += 6;
  if (n.fruitsVegetables != null && n.fruitsVegetables >= 40) score += 6;
  return clamp(score, 0, 100);
}

/** Graduated penalty for a rising nutrient. */
function risingPoints(value: number, lowMax: number, midMax: number, midPen: number, badPen: number): number {
  if (value <= lowMax) return 0;
  if (value <= midMax) return midPen;
  return badPen;
}

export function analyzeFood(product: ScannedProduct): FoodAnalysis {
  const n = product.nutriments ?? {
    energyKcal: null,
    sugars: null,
    saturatedFat: null,
    salt: null,
    proteins: null,
    fiber: null,
    fruitsVegetables: null,
  };
  const grade = product.nutriscoreGrade;

  // Negatives (per 100 g)
  const negatives: NutrientFinding[] = [];
  if (n.energyKcal != null) {
    const lvl = risingLevel(n.energyKcal, 150, 350);
    negatives.push(finding("energy", "Energy", Math.round(n.energyKcal), "kcal", lvl, NOTE[lvl].neg));
  }
  if (n.saturatedFat != null) {
    const lvl = risingLevel(n.saturatedFat, 1.5, 5);
    negatives.push(finding("satfat", "Saturated fat", n.saturatedFat, "g", lvl, NOTE[lvl].neg));
  }
  if (n.sugars != null) {
    const lvl = risingLevel(n.sugars, 5, 22.5);
    negatives.push(finding("sugars", "Sugars", n.sugars, "g", lvl, NOTE[lvl].neg));
  }
  if (n.salt != null) {
    const lvl = risingLevel(n.salt, 0.3, 1.5);
    negatives.push(finding("salt", "Salt", n.salt, "g", lvl, NOTE[lvl].neg));
  }

  // Positives (per 100 g)
  const positives: NutrientFinding[] = [];
  if (n.proteins != null) {
    const lvl = fallingLevel(n.proteins, 8, 4);
    positives.push(finding("protein", "Protein", n.proteins, "g", lvl, NOTE[lvl].pos));
  }
  if (n.fiber != null) {
    const lvl = fallingLevel(n.fiber, 3, 1.5);
    positives.push(finding("fiber", "Fibre", n.fiber, "g", lvl, NOTE[lvl].pos));
  }
  if (n.fruitsVegetables != null) {
    const lvl = fallingLevel(n.fruitsVegetables, 40, 20);
    positives.push(finding("fruitveg", "Fruit / veg", Math.round(n.fruitsVegetables), "%", lvl, NOTE[lvl].pos));
  }

  // Additives
  const additives: AdditiveFinding[] = product.additives.map((code) => {
    const info = additiveInfo(code);
    return { code: code.toUpperCase(), name: info.name, risk: info.risk };
  });
  const additivePenalty = Math.min(
    30,
    additives.reduce((s, a) => s + RISK_PENALTY[a.risk], 0)
  );

  // Score: prefer Nutri-Score, else derive from nutriments; then apply additive
  // penalty and a small organic bonus.
  const base =
    (grade && NUTRISCORE_BASE[grade] != null ? NUTRISCORE_BASE[grade] : null) ??
    baseFromNutriments(n);

  const hasData = base != null || negatives.length > 0 || additives.length > 0;
  const score =
    base != null
      ? Math.round(clamp(base - additivePenalty + (product.organic ? 4 : 0), 0, 100))
      : Math.round(clamp(70 - additivePenalty, 0, 100));

  return {
    score,
    band: foodBand(score),
    negatives,
    positives,
    additives,
    additiveCount: additives.length,
    nutriscoreGrade: grade,
    novaGroup: product.novaGroup,
    organic: product.organic,
    hasData,
  };
}
