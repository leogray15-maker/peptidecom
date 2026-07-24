// Product scoring — the "Yuka for skin" engine.
//
// Given a cosmetic/skincare product's ingredient list, produce:
//   • a 0–100 skin-suitability score and an Excellent/Good/Poor/Bad band,
//   • a Negatives list (flagged irritants & allergens, severity-weighted and
//     position-weighted — an ingredient near the top of the list is present in
//     higher concentration, so it counts for more), and
//   • a Positives list (barrier-supporting, soothing ingredients),
//   • a full ordered breakdown tagging every ingredient flag / good / neutral.
//
// Pure and dependency-free (Node-testable, safe on the client). No network.
// The score is an educational heuristic for sensitive / eczema-prone skin — the
// UI must always say so. It is not a safety verdict or a medical judgement.

import {
  type Irritant,
  type IrritantCategory,
  IRRITANTS,
  irritantSeverity,
  parseIngredients,
} from "@/lib/irritants";

// ─── Beneficial ("positive") ingredients ─────────────────────────────────────

export interface Beneficial {
  name: string;
  why: string;
  terms: string[];
}

export const BENEFICIALS: Beneficial[] = [
  {
    name: "Ceramides",
    why: "Rebuild the skin barrier — the exact lipids compromised in eczema-prone skin.",
    terms: ["ceramide"],
  },
  {
    name: "Glycerin",
    why: "A gentle humectant that pulls water into the skin. Well-tolerated by almost everyone.",
    terms: ["glycerin", "glycerol"],
  },
  {
    name: "Niacinamide (vitamin B3)",
    why: "Calms redness and supports the barrier — one of the best-tolerated actives.",
    terms: ["niacinamide", "nicotinamide"],
  },
  {
    name: "Panthenol (provitamin B5)",
    why: "Soothing and hydrating; helps calm irritated, compromised skin.",
    terms: ["panthenol", "pantothenic"],
  },
  {
    name: "Hyaluronic acid",
    why: "A large humectant that holds water in the skin without irritating.",
    terms: ["hyaluronic", "sodium hyaluronate", "hyaluronate"],
  },
  {
    name: "Colloidal oatmeal",
    why: "Clinically soothing for itch and irritation — an eczema staple.",
    terms: ["colloidal oat", "avena sativa", "oat kernel", "oatmeal"],
  },
  {
    name: "Shea butter",
    why: "A rich, occlusive emollient that softens and seals in moisture.",
    terms: ["butyrospermum", "shea butter"],
  },
  {
    name: "Squalane",
    why: "A lightweight, non-comedogenic emollient that mimics the skin's own oils.",
    terms: ["squalane"],
  },
  {
    name: "Petrolatum",
    why: "The gold-standard occlusive — locks in water and protects the barrier. Very low allergy risk.",
    terms: ["petrolatum", "petroleum jelly"],
  },
  {
    name: "Dimethicone",
    why: "A silicone that forms a breathable protective layer and reduces water loss.",
    terms: ["dimethicone"],
  },
  {
    name: "Allantoin",
    why: "Soothing and skin-protecting; helps calm irritation.",
    terms: ["allantoin"],
  },
  {
    name: "Centella asiatica (Cica)",
    why: "Calming and barrier-supporting; popular for reactive, sensitised skin.",
    terms: ["centella", "madecassoside", "asiaticoside", "cica"],
  },
  {
    name: "Zinc oxide",
    why: "A gentle mineral that protects and soothes; kinder to reactive skin than chemical filters.",
    terms: ["zinc oxide"],
  },
  {
    name: "Urea",
    why: "Hydrates and gently smooths rough, dry patches at low concentrations.",
    terms: ["urea"],
  },
  {
    name: "Bisabolol",
    why: "A chamomile-derived calming agent that reduces the look of redness.",
    terms: ["bisabolol"],
  },
];

// ─── Bands (Yuka-style) ──────────────────────────────────────────────────────

export type ScoreTone = "emerald" | "green" | "orange" | "rose";

export interface ScoreBand {
  label: "Excellent" | "Good" | "Poor" | "Bad";
  tone: ScoreTone;
  blurb: string;
}

export function scoreBand(score: number): ScoreBand {
  if (score >= 75)
    return { label: "Excellent", tone: "emerald", blurb: "A great pick for sensitive, eczema-prone skin." };
  if (score >= 50)
    return { label: "Good", tone: "green", blurb: "A reasonable choice — a couple of things to keep an eye on." };
  if (score >= 25)
    return { label: "Poor", tone: "orange", blurb: "Some ingredients here commonly trigger reactive skin." };
  return { label: "Bad", tone: "rose", blurb: "Several strong irritants or allergens — patch-test with care." };
}

// ─── Analysis ────────────────────────────────────────────────────────────────

export type ListZone = "top" | "mid" | "base";

export interface NegativeFinding {
  name: string;
  why: string;
  category: IrritantCategory;
  severity: 1 | 2 | 3;
  /** Points this finding removed from the score. */
  penalty: number;
  /** Where in the ingredient list it first appears (concentration proxy). */
  zone: ListZone | null;
  hits: string[];
}

export interface PositiveFinding {
  name: string;
  why: string;
  hits: string[];
}

export interface BreakdownItem {
  name: string;
  tag: "flag" | "good" | "neutral";
}

export interface ProductAnalysis {
  score: number;
  band: ScoreBand;
  ingredientCount: number;
  /** How many ingredients matched something we know (flag or good). */
  recognizedCount: number;
  negatives: NegativeFinding[];
  positives: PositiveFinding[];
  breakdown: BreakdownItem[];
  /** True when we had no ingredients to work with. */
  empty: boolean;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Severity → base points removed for a top-of-list occurrence. */
const SEVERITY_PENALTY: Record<1 | 2 | 3, number> = { 1: 8, 2: 15, 3: 24 };

/** Concentration proxy: earlier in the list = stronger effect. */
const ZONE_MULTIPLIER: Record<ListZone, number> = { top: 1, mid: 0.65, base: 0.4 };

function zoneOf(index: number, total: number): ListZone {
  if (total <= 1) return "top";
  const frac = index / total;
  if (frac < 1 / 3) return "top";
  if (frac < 2 / 3) return "mid";
  return "base";
}

function termHitsToken(normalizedToken: string, terms: string[]): boolean {
  return terms.some((t) => normalizedToken.includes(t.trim().toLowerCase()));
}

/** Analyse a raw ingredient list into a scored, Yuka-style breakdown. */
export function analyzeIngredients(text: string): ProductAnalysis {
  const tokens = parseIngredients(text);
  const total = tokens.length;

  if (total === 0) {
    return {
      score: 0,
      band: scoreBand(0),
      ingredientCount: 0,
      recognizedCount: 0,
      negatives: [],
      positives: [],
      breakdown: [],
      empty: true,
    };
  }

  // Per-token tag for the ordered breakdown.
  const tags: ("flag" | "good" | "neutral")[] = new Array(total).fill("neutral");

  // ── Negatives ──────────────────────────────────────────────────────────
  const negatives: NegativeFinding[] = [];
  for (const irritant of IRRITANTS) {
    let firstIndex = -1;
    const hits = new Set<string>();
    tokens.forEach((tok, i) => {
      if (termHitsToken(tok.normalized, irritant.terms)) {
        if (firstIndex === -1) firstIndex = i;
        hits.add(tok.raw);
        tags[i] = "flag";
      }
    });
    if (firstIndex === -1) continue;

    const severity = irritantSeverity(irritant as Irritant);
    const zone = zoneOf(firstIndex, total);
    const penalty =
      Math.round(SEVERITY_PENALTY[severity] * ZONE_MULTIPLIER[zone] * 10) / 10;
    negatives.push({
      name: irritant.name,
      why: irritant.why,
      category: irritant.category,
      severity,
      penalty,
      zone,
      hits: [...hits],
    });
  }

  // ── Positives ──────────────────────────────────────────────────────────
  const positives: PositiveFinding[] = [];
  for (const good of BENEFICIALS) {
    const hits = new Set<string>();
    tokens.forEach((tok, i) => {
      if (termHitsToken(tok.normalized, good.terms)) {
        hits.add(tok.raw);
        if (tags[i] === "neutral") tags[i] = "good";
      }
    });
    if (hits.size > 0) {
      positives.push({ name: good.name, why: good.why, hits: [...hits] });
    }
  }

  // ── Score ────────────────────────────────────────────────────────────────
  // Start at 100, subtract severity/position-weighted penalties, add a small
  // capped credit for barrier-friendly ingredients.
  const totalPenalty = negatives.reduce((s, n) => s + n.penalty, 0);
  const positiveCredit = Math.min(12, positives.length * 3);
  const score = Math.round(clamp(100 - totalPenalty + positiveCredit, 0, 100));

  // Order negatives worst-first for display.
  negatives.sort((a, b) => b.penalty - a.penalty);

  const breakdown: BreakdownItem[] = tokens.map((t, i) => ({ name: t.raw, tag: tags[i] }));
  const recognizedCount = tags.filter((t) => t !== "neutral").length;

  return {
    score,
    band: scoreBand(score),
    ingredientCount: total,
    recognizedCount,
    negatives,
    positives,
    breakdown,
    empty: false,
  };
}

// ─── Product shape + API normaliser ──────────────────────────────────────────

export type ProductSource =
  | "openbeautyfacts"
  | "openproductsfacts"
  | "openfoodfacts"
  | "manual";

/** How a product is scored: cosmetics get a skin-suitability score, foods get a
 * nutrition score (Yuka-style). */
export type ProductKind = "cosmetic" | "food";

/** Nutrition values normalised to per-100g/ml. Any field may be missing. */
export interface Nutriments {
  energyKcal: number | null;
  sugars: number | null;
  saturatedFat: number | null;
  salt: number | null;
  proteins: number | null;
  fiber: number | null;
  /** Estimated fruit/veg/nut/legume content, %. */
  fruitsVegetables: number | null;
}

export interface ScannedProduct {
  code: string;
  name: string | null;
  brand: string | null;
  imageUrl: string | null;
  ingredientsText: string | null;
  source: ProductSource;
  found: boolean;
  /** Food vs cosmetic — decides which scorer the UI runs. */
  kind: ProductKind;
  /** Nutri-Score letter a–e (foods), when the database has it. */
  nutriscoreGrade: string | null;
  /** NOVA processing group 1–4 (foods), when available. */
  novaGroup: number | null;
  /** Additive E-numbers, e.g. ["e330","e621"]. */
  additives: string[];
  /** Whether the product carries an organic/bio label. */
  organic: boolean;
  nutriments: Nutriments | null;
}

/** Shape of the relevant slice of an Open Beauty/Products/Food Facts response
 * (v2 and legacy v0 share these fields). `status` may be the number 1/0 or the
 * string "success"/"failure" depending on the endpoint version. */
export interface OffApiResponse {
  status?: number | string;
  status_verbose?: string;
  code?: string;
  product?: {
    product_name?: string;
    product_name_en?: string;
    brands?: string;
    image_front_small_url?: string;
    image_front_url?: string;
    image_url?: string;
    ingredients_text?: string;
    ingredients_text_en?: string;
    ingredients_text_with_allergens?: string;
    ingredients?: { text?: string }[];
    // Food-specific fields (Open Food/Products Facts).
    nutriscore_grade?: string;
    nutrition_grades?: string;
    nova_group?: number | string;
    additives_tags?: string[];
    additives_n?: number;
    labels_tags?: string[];
    categories_tags?: string[];
    nutriments?: Record<string, number | string | undefined>;
  };
}

/** Coerce an Open Facts numeric field (they're sometimes strings) to a number. */
function num(v: number | string | undefined): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** First non-null nutriment across candidate keys (per-100g preferred). */
function nutriment(
  n: Record<string, number | string | undefined>,
  ...keys: string[]
): number | null {
  for (const k of keys) {
    const v = num(n[k]);
    if (v != null) return v;
  }
  return null;
}

function firstNonEmpty(...vals: (string | undefined | null)[]): string | null {
  for (const v of vals) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

/** Normalise an Open Beauty/Products/Food Facts payload into our ScannedProduct.
 * Pure, so it can be unit-tested against a captured response with no network.
 *
 * "Found" is deliberately lenient: different Open Facts endpoints and versions
 * report success differently (status 1 vs "success"), and some products come
 * back with a product object but status 0. We treat a product as found when
 * there's a product object carrying anything identifying — a name, brand or
 * ingredients — so a real hit is never dropped over a status-field quirk. */
export function normalizeOffProduct(
  code: string,
  data: OffApiResponse,
  source: ProductSource
): ScannedProduct {
  const p = data.product ?? {};
  const name = firstNonEmpty(p.product_name_en, p.product_name);
  const brand = firstNonEmpty(p.brands);
  const imageUrl = firstNonEmpty(p.image_front_small_url, p.image_front_url, p.image_url);

  let ingredientsText = firstNonEmpty(
    p.ingredients_text_en,
    p.ingredients_text,
    p.ingredients_text_with_allergens
  );
  if (!ingredientsText && Array.isArray(p.ingredients) && p.ingredients.length > 0) {
    const joined = p.ingredients
      .map((i) => (typeof i.text === "string" ? i.text : ""))
      .filter(Boolean)
      .join(", ");
    ingredientsText = joined.length > 0 ? joined : null;
  }

  // ── Nutrition (foods) ────────────────────────────────────────────────────
  const rawN = p.nutriments ?? {};
  const nutriments: Nutriments = {
    energyKcal: nutriment(rawN, "energy-kcal_100g", "energy-kcal", "energy-kcal_value"),
    sugars: nutriment(rawN, "sugars_100g", "sugars"),
    saturatedFat: nutriment(rawN, "saturated-fat_100g", "saturated-fat"),
    salt: (() => {
      const salt = nutriment(rawN, "salt_100g", "salt");
      if (salt != null) return salt;
      const sodium = nutriment(rawN, "sodium_100g", "sodium");
      return sodium != null ? Math.round(sodium * 2.5 * 100) / 100 : null;
    })(),
    proteins: nutriment(rawN, "proteins_100g", "proteins"),
    fiber: nutriment(rawN, "fiber_100g", "fiber"),
    fruitsVegetables: nutriment(
      rawN,
      "fruits-vegetables-nuts-estimate-from-ingredients_100g",
      "fruits-vegetables-nuts_100g",
      "fruits-vegetables-legumes-estimate-from-ingredients_100g"
    ),
  };
  const hasNutrition =
    Object.values(nutriments).some((v) => v != null) || !!p.nutriscore_grade;

  const nutriscoreGrade = firstNonEmpty(p.nutriscore_grade, p.nutrition_grades)?.toLowerCase() ?? null;
  const novaGroup = num(p.nova_group);
  const additives = Array.isArray(p.additives_tags)
    ? p.additives_tags.map((t) => t.replace(/^en:/, "").toLowerCase()).filter((t) => /^e\d/.test(t))
    : [];
  const organic = Array.isArray(p.labels_tags)
    ? p.labels_tags.some((t) => /organic|bio|eu-organic/i.test(t))
    : false;

  // Food if it came from Open Food Facts, or carries nutrition data. Otherwise
  // treat it as a cosmetic and score its ingredients for skin.
  const kind: ProductKind =
    source === "openfoodfacts" || hasNutrition ? "food" : "cosmetic";

  const statusOk = data.status === 1 || data.status === "success";
  const hasContent = !!(name || brand || imageUrl || ingredientsText || hasNutrition);
  const found = !!data.product && (statusOk || hasContent);

  return {
    code,
    name,
    brand,
    imageUrl,
    ingredientsText,
    source,
    found,
    kind,
    nutriscoreGrade,
    novaGroup: novaGroup != null ? Math.round(novaGroup) : null,
    additives,
    organic,
    nutriments: hasNutrition ? nutriments : null,
  };
}
