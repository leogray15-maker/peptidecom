// Restaurant scoring — "how healthy is eating here likely to be?"
//
// Given what open map data tells us about a venue (what kind of place it is,
// what cuisines it serves, whether it caters for plant-based or organic diets,
// and what it calls itself), produce:
//   • a 0–100 score and an Excellent/Good/Poor/Bad band, matching the
//     thresholds the product and food scanners already use,
//   • a Positives list (salad-led menus, plant-based options, organic sourcing)
//     and a Negatives list (deep-fried, dessert-led, fast food), and
//   • a confidence level, because a venue with no cuisine tags at all is a
//     guess from its category alone and the UI has to say so.
//
// Pure and dependency-free (Node-testable, safe on the client). No network.
// This is an educational heuristic built on crowd-sourced tags, not a
// nutritional analysis of an actual menu — the UI must always say so.

import type { ScoreBand, ScoreTone } from "@/lib/product-score";

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// ─── Band ────────────────────────────────────────────────────────────────────

export function restaurantBand(score: number): ScoreBand {
  if (score >= 75)
    return {
      label: "Excellent",
      tone: "emerald",
      blurb: "Built around genuinely healthy food — hard to order badly here.",
    };
  if (score >= 50)
    return {
      label: "Good",
      tone: "green",
      blurb: "A solid choice if you pick the lighter end of the menu.",
    };
  if (score >= 25)
    return {
      label: "Poor",
      tone: "orange",
      blurb: "Order carefully — most of this menu is the indulgent kind.",
    };
  return {
    label: "Bad",
    tone: "rose",
    blurb: "A treat, not a staple. Worth knowing before you're stood outside.",
  };
}

// ─── Inputs ──────────────────────────────────────────────────────────────────

/** The venue categories we map: sit-down, café, and counter/fast food. */
export type VenueKind = "restaurant" | "cafe" | "fast_food";

/** OpenStreetMap's `diet:*` and `organic` scale. */
export type DietLevel = "only" | "yes" | "limited" | "no";

export interface RestaurantSignals {
  name: string | null;
  kind: VenueKind;
  /** Normalised cuisine tags, e.g. ["salad", "vegan"]. */
  cuisines: string[];
  vegan: DietLevel | null;
  vegetarian: DietLevel | null;
  glutenFree: DietLevel | null;
  organic: DietLevel | null;
}

// ─── Findings ────────────────────────────────────────────────────────────────

export interface RestaurantFinding {
  id: string;
  label: string;
  note: string;
  /** Points this contributed, before the per-group caps. */
  weight: number;
}

/** How much evidence the score rests on. `low` means "we only know what kind of
 * venue this is" — the UI badges those so nobody reads a guess as a verdict. */
export type Confidence = "high" | "medium" | "low";

export interface RestaurantAnalysis {
  score: number;
  band: ScoreBand;
  positives: RestaurantFinding[];
  negatives: RestaurantFinding[];
  /** Short chips for the map pin and the list row, best signals first. */
  tags: string[];
  confidence: Confidence;
}

// ─── Where a venue starts before its menu is considered ──────────────────────

const KIND_BASE: Record<VenueKind, number> = {
  restaurant: 54,
  cafe: 50,
  fast_food: 32,
};

export const KIND_LABEL: Record<VenueKind, string> = {
  restaurant: "Restaurant",
  cafe: "Café",
  fast_food: "Fast food",
};

// ─── Cuisines ────────────────────────────────────────────────────────────────

interface CuisineInfo {
  label: string;
  weight: number;
  note: string;
}

/** Curated cuisine weights. Keys are OpenStreetMap `cuisine=` values. Anything
 * not listed contributes nothing rather than being guessed at. */
const CUISINES: Record<string, CuisineInfo> = {
  // Strongly healthy-leaning
  salad: { label: "Salads", weight: 18, note: "Salad-led menu — the easiest place to eat well." },
  health_food: { label: "Health food", weight: 18, note: "Trades on healthy eating." },
  vegan: { label: "Vegan", weight: 16, note: "Entirely plant-based menu." },
  poke: { label: "Poke", weight: 14, note: "Raw fish, rice and vegetable bowls." },
  vegetarian: { label: "Vegetarian", weight: 12, note: "Entirely meat-free menu." },
  mediterranean: {
    label: "Mediterranean",
    weight: 12,
    note: "Olive oil, fish, pulses and vegetables — one of the best-studied ways of eating.",
  },
  sushi: { label: "Sushi", weight: 10, note: "Fish and rice, mostly unfried." },
  juice: { label: "Juice bar", weight: 8, note: "Fruit and vegetable-led drinks (watch the sugar)." },
  lebanese: { label: "Lebanese", weight: 9, note: "Grilled meat, pulses and plenty of salad." },
  vietnamese: { label: "Vietnamese", weight: 8, note: "Broths, herbs and fresh rolls." },
  seafood: { label: "Seafood", weight: 8, note: "Fish-forward menu." },
  fish: { label: "Fish", weight: 8, note: "Fish-forward menu." },
  japanese: { label: "Japanese", weight: 8, note: "Lighter cooking methods and plenty of fish." },
  soup: { label: "Soup", weight: 8, note: "Vegetable-heavy and rarely fried." },
  greek: { label: "Greek", weight: 8, note: "Grills, salads and pulses." },
  middle_eastern: { label: "Middle Eastern", weight: 7, note: "Pulses, grains and salads." },
  buddhist: { label: "Buddhist", weight: 6, note: "Typically vegetarian." },
  korean: { label: "Korean", weight: 5, note: "Fermented vegetables and grilled dishes." },
  thai: { label: "Thai", weight: 5, note: "Fresh herbs and stir-fries — sugar and salt can be high." },
  deli: { label: "Deli", weight: 3, note: "Made-to-order, so you can steer it." },
  sandwich: { label: "Sandwiches", weight: 2, note: "Easy to make a decent choice, easy not to." },
  wraps: { label: "Wraps", weight: 2, note: "Easy to make a decent choice, easy not to." },
  turkish: { label: "Turkish", weight: 4, note: "Grills and mezze, alongside the heavier options." },
  breakfast: { label: "Breakfast", weight: 2, note: "Depends entirely on what you order." },
  indian: { label: "Indian", weight: 2, note: "Pulses and vegetables, but often rich sauces." },

  // Neutral-to-indulgent
  mexican: { label: "Mexican", weight: -2, note: "Beans and salsa, but plenty of cheese and frying." },
  chinese: { label: "Chinese", weight: -2, note: "Often high in salt, oil and sugar." },
  italian: { label: "Italian", weight: -2, note: "Refined carbohydrates lead most menus." },
  pasta: { label: "Pasta", weight: -3, note: "Refined carbohydrates lead the menu." },
  coffee_shop: { label: "Coffee shop", weight: -2, note: "Food is usually pastry-led." },
  steak_house: { label: "Steakhouse", weight: -4, note: "Red meat-led, often with heavy sides." },
  barbecue: { label: "Barbecue", weight: -4, note: "Fatty cuts and sugary sauces." },
  american: { label: "American", weight: -6, note: "Portion sizes and frying tend to run high." },
  bakery: { label: "Bakery", weight: -6, note: "Refined flour and sugar are the whole menu." },
  pancake: { label: "Pancakes", weight: -8, note: "Sugar-led." },
  pie: { label: "Pies", weight: -8, note: "Pastry, saturated fat and salt." },
  crepe: { label: "Crêpes", weight: -6, note: "Mostly a dessert menu." },
  pizza: { label: "Pizza", weight: -10, note: "Refined flour, cheese and salt." },
  dessert: { label: "Desserts", weight: -10, note: "Sugar is the point." },
  chocolate: { label: "Chocolate", weight: -10, note: "Sugar is the point." },
  cake: { label: "Cakes", weight: -10, note: "Sugar is the point." },
  bubble_tea: { label: "Bubble tea", weight: -10, note: "Very high sugar drinks." },
  kebab: { label: "Kebab", weight: -10, note: "Processed meat, salt and fat — grills are the better half." },
  sausage: { label: "Sausages", weight: -10, note: "Processed meat, high in salt and saturated fat." },
  ice_cream: { label: "Ice cream", weight: -12, note: "Sugar and saturated fat." },
  waffle: { label: "Waffles", weight: -12, note: "Sugar-led." },
  chicken_wings: { label: "Wings", weight: -12, note: "Usually deep-fried." },
  fast_food: { label: "Fast food", weight: -12, note: "Built for speed, not for nutrition." },
  burger: { label: "Burgers", weight: -14, note: "Fried sides, refined buns, high salt." },
  fish_and_chips: { label: "Fish & chips", weight: -14, note: "Deep-fried, high salt." },
  friture: { label: "Fried food", weight: -14, note: "Deep-fried, high salt." },
  hot_dog: { label: "Hot dogs", weight: -14, note: "Processed meat and refined bread." },
  fried_chicken: { label: "Fried chicken", weight: -16, note: "Deep-fried and high in salt." },
  donut: { label: "Doughnuts", weight: -16, note: "Fried dough and sugar." },
};

export function cuisineInfo(cuisine: string): CuisineInfo | null {
  return CUISINES[cuisine] ?? null;
}

/** How far the cuisine tags alone can move a score in either direction. */
const CUISINE_CAP = 30;

// ─── Diet & sourcing tags ────────────────────────────────────────────────────

const VEGAN_POINTS: Record<DietLevel, number> = { only: 14, yes: 8, limited: 3, no: -2 };
const VEGETARIAN_POINTS: Record<DietLevel, number> = { only: 10, yes: 5, limited: 2, no: -2 };
const ORGANIC_POINTS: Record<DietLevel, number> = { only: 12, yes: 7, limited: 3, no: 0 };
const GLUTEN_FREE_POINTS: Record<DietLevel, number> = { only: 4, yes: 3, limited: 1, no: 0 };

const DIET_CAP = 26;

// ─── Name keywords ───────────────────────────────────────────────────────────
//
// A weak signal — plenty of salad bars aren't called one — so it is capped hard
// and every finding says out loud that it came from the name.

const NAME_HINTS: { terms: string[]; label: string; weight: number }[] = [
  { terms: ["salad"], label: "salad", weight: 5 },
  { terms: ["poke"], label: "poke", weight: 4 },
  { terms: ["vegan", "plant based", "plant-based"], label: "plant-based", weight: 5 },
  { terms: ["veggie", "vegetarian"], label: "vegetarian", weight: 4 },
  { terms: ["juice", "smoothie"], label: "juice", weight: 3 },
  { terms: ["organic"], label: "organic", weight: 4 },
  { terms: ["wholefood", "whole food", "wholesome"], label: "wholefood", weight: 4 },
  { terms: ["health", "nutrition", "nourish"], label: "health", weight: 3 },
  { terms: ["greens", "sprout", "garden"], label: "greens", weight: 3 },
  { terms: ["grill"], label: "grill", weight: 1 },
  { terms: ["fried", "fry", "fries"], label: "fried", weight: -5 },
  { terms: ["burger"], label: "burger", weight: -5 },
  { terms: ["pizza"], label: "pizza", weight: -4 },
  { terms: ["kebab"], label: "kebab", weight: -4 },
  { terms: ["wings"], label: "wings", weight: -4 },
  { terms: ["donut", "doughnut"], label: "doughnut", weight: -5 },
  { terms: ["dessert", "candy", "sweets", "gelato", "waffle"], label: "dessert", weight: -4 },
  { terms: ["chippy", "chip shop"], label: "chip shop", weight: -5 },
];

const NAME_CAP = 8;

function nameFindings(name: string | null): RestaurantFinding[] {
  if (!name) return [];
  const lower = name.toLowerCase();
  const out: RestaurantFinding[] = [];
  for (const hint of NAME_HINTS) {
    if (!hint.terms.some((t) => lower.includes(t))) continue;
    out.push({
      id: `name:${hint.label}`,
      label: hint.weight > 0 ? `Name says "${hint.label}"` : `Name says "${hint.label}"`,
      note:
        hint.weight > 0
          ? "The name points at the lighter end of the menu — a hint, not a guarantee."
          : "The name points at the indulgent end of the menu — a hint, not a guarantee.",
      weight: hint.weight,
    });
  }
  return out;
}

// ─── Analysis ────────────────────────────────────────────────────────────────

/** Sum a group's weights, then squeeze the total into ±cap so no single group
 * can run away with the score. Individual findings keep their raw weight for
 * display; only the contribution to the score is capped. */
function capped(findings: RestaurantFinding[], cap: number): number {
  const total = findings.reduce((s, f) => s + f.weight, 0);
  return clamp(total, -cap, cap);
}

function dietFinding(
  id: string,
  level: DietLevel,
  points: Record<DietLevel, number>,
  labels: Record<DietLevel, string>,
  notes: Record<DietLevel, string>
): RestaurantFinding | null {
  const weight = points[level];
  if (weight === 0) return null;
  return { id, label: labels[level], note: notes[level], weight };
}

export function analyzeRestaurant(signals: RestaurantSignals): RestaurantAnalysis {
  const findings: RestaurantFinding[] = [];

  // Cuisines
  const cuisineFindings: RestaurantFinding[] = [];
  const seen = new Set<string>();
  for (const cuisine of signals.cuisines) {
    if (seen.has(cuisine)) continue;
    seen.add(cuisine);
    const info = CUISINES[cuisine];
    if (!info) continue;
    cuisineFindings.push({
      id: `cuisine:${cuisine}`,
      label: info.label,
      note: info.note,
      weight: info.weight,
    });
  }

  // Diet & sourcing
  const dietFindings: RestaurantFinding[] = [];
  if (signals.vegan) {
    const f = dietFinding(
      "diet:vegan",
      signals.vegan,
      VEGAN_POINTS,
      {
        only: "Fully vegan",
        yes: "Vegan options",
        limited: "Some vegan options",
        no: "No vegan options",
      },
      {
        only: "Everything on the menu is plant-based.",
        yes: "Proper vegan dishes, not just a side salad.",
        limited: "A couple of plant-based dishes.",
        no: "Nothing plant-based listed.",
      }
    );
    if (f) dietFindings.push(f);
  }
  if (signals.vegetarian) {
    const f = dietFinding(
      "diet:vegetarian",
      signals.vegetarian,
      VEGETARIAN_POINTS,
      {
        only: "Fully vegetarian",
        yes: "Vegetarian options",
        limited: "Some vegetarian options",
        no: "No vegetarian options",
      },
      {
        only: "Meat-free throughout.",
        yes: "Vegetarian dishes across the menu.",
        limited: "A couple of meat-free dishes.",
        no: "Nothing meat-free listed.",
      }
    );
    if (f) dietFindings.push(f);
  }
  if (signals.organic) {
    const f = dietFinding(
      "organic",
      signals.organic,
      ORGANIC_POINTS,
      {
        only: "Fully organic",
        yes: "Organic ingredients",
        limited: "Some organic ingredients",
        no: "Not organic",
      },
      {
        only: "Sources organic ingredients throughout.",
        yes: "Uses organic ingredients.",
        limited: "Some organic ingredients on the menu.",
        no: "No organic sourcing listed.",
      }
    );
    if (f) dietFindings.push(f);
  }
  if (signals.glutenFree) {
    const f = dietFinding(
      "diet:gluten_free",
      signals.glutenFree,
      GLUTEN_FREE_POINTS,
      {
        only: "Fully gluten-free",
        yes: "Gluten-free options",
        limited: "Some gluten-free options",
        no: "No gluten-free options",
      },
      {
        only: "The whole kitchen is gluten-free.",
        yes: "Caters for gluten-free diets.",
        limited: "A couple of gluten-free dishes.",
        no: "Nothing gluten-free listed.",
      }
    );
    if (f) dietFindings.push(f);
  }

  // Name
  const nameHints = nameFindings(signals.name);

  findings.push(...cuisineFindings, ...dietFindings, ...nameHints);

  const score = Math.round(
    clamp(
      KIND_BASE[signals.kind] +
        capped(cuisineFindings, CUISINE_CAP) +
        capped(dietFindings, DIET_CAP) +
        capped(nameHints, NAME_CAP),
      0,
      100
    )
  );

  // A fast-food counter is a real finding in its own right, so it shows up in
  // the negatives rather than silently dragging the base down.
  const kindFinding: RestaurantFinding | null =
    signals.kind === "fast_food"
      ? {
          id: "kind:fast_food",
          label: "Fast-food counter",
          note: "Built for speed — expect fried options and large portions.",
          weight: -8,
        }
      : null;

  const positives = findings.filter((f) => f.weight > 0).sort((a, b) => b.weight - a.weight);
  const negatives = [...(kindFinding ? [kindFinding] : []), ...findings.filter((f) => f.weight < 0)].sort(
    (a, b) => a.weight - b.weight
  );

  // Confidence: cuisine and diet tags are real evidence; the name is not.
  const evidence = cuisineFindings.length + dietFindings.length;
  const confidence: Confidence = evidence >= 2 ? "high" : evidence === 1 ? "medium" : "low";

  return {
    score,
    band: restaurantBand(score),
    positives,
    negatives,
    tags: [...positives, ...negatives]
      .filter((f) => !f.id.startsWith("name:"))
      .slice(0, 3)
      .map((f) => f.label),
    confidence,
  };
}

// ─── Display helpers ─────────────────────────────────────────────────────────

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: "Menu data",
  medium: "Some menu data",
  low: "Limited data",
};

export const TONE_BG: Record<ScoreTone, string> = {
  emerald: "bg-emerald-500",
  green: "bg-lime-500",
  orange: "bg-orange-500",
  rose: "bg-rose-500",
};

export const TONE_BORDER: Record<ScoreTone, string> = {
  emerald: "border-emerald-500/40",
  green: "border-lime-500/40",
  orange: "border-orange-500/40",
  rose: "border-rose-500/40",
};
