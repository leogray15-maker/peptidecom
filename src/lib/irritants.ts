// Ingredient irritant checker — on-device matching of a product's ingredient
// list against a curated set of common eczema/sensitive-skin irritants and
// contact allergens.
//
// Pure, dependency-free, Node-testable (scripts/irritants.test.ts), safe on the
// client. NO network, NO OCR service, NO paid API — the user pastes or types
// the ingredient list (from the back of the pack) and everything runs locally.
//
// SOURCES for the flag list (educational, general — not personalised):
//   • American Contact Dermatitis Society "Core Allergen" series
//   • EU Cosmetics Regulation Annex III fragrance allergen list (26 named)
//   • National Eczema Association "ingredients to watch" guidance
// A match is NOT a verdict — many people tolerate these fine. The UI must say so.

export type IrritantCategory =
  | "fragrance"
  | "preservative"
  | "surfactant"
  | "alcohol"
  | "botanical"
  | "other";

export interface Irritant {
  /** Canonical display name. */
  name: string;
  category: IrritantCategory;
  /** One-line, plain-English reason it's on the watch list. */
  why: string;
  /** Lowercased match terms (INCI names, synonyms). Matched as word-ish
   * substrings against the normalised ingredient text. */
  terms: string[];
}

export const CATEGORY_LABEL: Record<IrritantCategory, string> = {
  fragrance: "Fragrance / allergen",
  preservative: "Preservative",
  surfactant: "Harsh surfactant",
  alcohol: "Drying alcohol",
  botanical: "Botanical / essential oil",
  other: "Other",
};

export const IRRITANTS: Irritant[] = [
  // ── Fragrance & named fragrance allergens ────────────────────────────────
  {
    name: "Fragrance / parfum",
    category: "fragrance",
    why: "The single most common cause of cosmetic contact allergy. “Unscented” is safer than “fragrance-free-scented”.",
    terms: ["fragrance", "parfum", "perfume", "aroma"],
  },
  {
    name: "Linalool",
    category: "fragrance",
    why: "A fragrance allergen (EU-labelled); oxidises on the shelf into a stronger sensitiser.",
    terms: ["linalool"],
  },
  {
    name: "Limonene",
    category: "fragrance",
    why: "Citrus fragrance allergen (EU-labelled); oxidised limonene is a known sensitiser.",
    terms: ["limonene"],
  },
  {
    name: "Geraniol",
    category: "fragrance",
    why: "Rose-scented fragrance allergen on the EU 26 list.",
    terms: ["geraniol"],
  },
  {
    name: "Citronellol",
    category: "fragrance",
    why: "Fragrance allergen on the EU 26 list.",
    terms: ["citronellol"],
  },
  {
    name: "Eugenol",
    category: "fragrance",
    why: "Clove-like fragrance allergen on the EU 26 list.",
    terms: ["eugenol"],
  },
  {
    name: "Coumarin",
    category: "fragrance",
    why: "Sweet-hay fragrance allergen on the EU 26 list.",
    terms: ["coumarin"],
  },
  {
    name: "Cinnamal / cinnamic aldehyde",
    category: "fragrance",
    why: "One of the more potent named fragrance allergens.",
    terms: ["cinnamal", "cinnamaldehyde", "cinnamic aldehyde"],
  },
  {
    name: "Hydroxycitronellal",
    category: "fragrance",
    why: "Lily-of-the-valley fragrance allergen on the EU 26 list.",
    terms: ["hydroxycitronellal"],
  },
  {
    name: "Benzyl alcohol / benzyl salicylate",
    category: "fragrance",
    why: "Fragrance-family ingredient and preservative; a recognised allergen for some.",
    terms: ["benzyl alcohol", "benzyl salicylate", "benzyl benzoate", "benzyl cinnamate"],
  },

  // ── Preservatives ────────────────────────────────────────────────────────
  {
    name: "Methylisothiazolinone (MI/MCI)",
    category: "preservative",
    why: "A leading cause of preservative contact allergy — flagged by dermatology bodies as high-risk in leave-on products.",
    terms: [
      "methylisothiazolinone",
      "methylchloroisothiazolinone",
      "isothiazolinone",
      "kathon",
    ],
  },
  {
    name: "Formaldehyde releasers",
    category: "preservative",
    why: "Slowly release formaldehyde, a known sensitiser (DMDM hydantoin, quaternium-15, imidazolidinyl/diazolidinyl urea, bronopol).",
    terms: [
      "formaldehyde",
      "dmdm hydantoin",
      "quaternium-15",
      "imidazolidinyl urea",
      "diazolidinyl urea",
      "bronopol",
      "2-bromo-2-nitropropane",
      "sodium hydroxymethylglycinate",
    ],
  },
  {
    name: "Parabens",
    category: "preservative",
    why: "Usually well-tolerated, but a known allergen for a minority — worth knowing if you react.",
    terms: ["paraben"],
  },
  {
    name: "Phenoxyethanol",
    category: "preservative",
    why: "Common preservative; occasionally irritating on very compromised skin.",
    terms: ["phenoxyethanol"],
  },

  // ── Harsh surfactants ────────────────────────────────────────────────────
  {
    name: "Sodium lauryl sulfate (SLS)",
    category: "surfactant",
    why: "A strong detergent that strips the skin barrier — a classic eczema aggravator in cleansers.",
    terms: ["sodium lauryl sulfate", "sodium lauryl sulphate", "sls "],
  },
  {
    name: "Sodium laureth sulfate (SLES)",
    category: "surfactant",
    why: "Milder than SLS but still stripping for very reactive skin.",
    terms: ["sodium laureth sulfate", "sodium laureth sulphate"],
  },
  {
    name: "Cocamidopropyl betaine",
    category: "surfactant",
    why: "A “gentle” coconut-derived surfactant that is nonetheless a recognised contact allergen.",
    terms: ["cocamidopropyl betaine"],
  },

  // ── Drying alcohols ──────────────────────────────────────────────────────
  {
    name: "Denatured / SD alcohol",
    category: "alcohol",
    why: "Volatile alcohol that can dry and sting compromised skin (fatty alcohols like cetyl/stearyl are fine).",
    terms: ["alcohol denat", "denatured alcohol", "sd alcohol", "ethanol", "isopropyl alcohol"],
  },

  // ── Botanicals & essential oils ──────────────────────────────────────────
  {
    name: "Essential oils (tea tree, lavender, peppermint, citrus)",
    category: "botanical",
    why: "“Natural” but among the most common flare triggers — high in fragrance allergens.",
    terms: [
      "tea tree",
      "melaleuca",
      "lavender oil",
      "lavandula",
      "peppermint oil",
      "mentha piperita",
      "citrus",
      "eucalyptus",
      "ylang",
      "essential oil",
    ],
  },
  {
    name: "Lanolin",
    category: "botanical",
    why: "Sheep-wool-derived emollient; helpful for many but a known allergen for some.",
    terms: ["lanolin"],
  },
  {
    name: "Propylene glycol",
    category: "other",
    why: "A humectant/solvent that can sting or irritate a subset of eczema-prone skin.",
    terms: ["propylene glycol"],
  },
  {
    name: "Menthol",
    category: "other",
    why: "The cooling agent in many anti-itch products — soothing at first, drying and irritating with overuse.",
    terms: ["menthol"],
  },
];

export interface IngredientToken {
  raw: string;
  normalized: string;
}

/** Split a pasted ingredient list into individual ingredient tokens.
 * Handles commas, semicolons, bullets, newlines and stray brackets. */
export function parseIngredients(text: string): IngredientToken[] {
  return text
    .split(/[,;\n•·|]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((raw) => ({ raw, normalized: normalize(raw) }));
}

function normalize(s: string): string {
  return ` ${s.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim()} `;
}

export interface IrritantMatch {
  irritant: Irritant;
  /** The ingredient tokens that triggered the match. */
  hits: string[];
}

export interface ScanResult {
  ingredientCount: number;
  matches: IrritantMatch[];
  /** Ingredients not matched to any watch-list entry. */
  cleanCount: number;
}

/** Match parsed ingredients against the irritant watch list. */
export function scanIngredients(text: string): ScanResult {
  const tokens = parseIngredients(text);
  const joined = tokens.map((t) => t.normalized).join(" || ");
  const matches: IrritantMatch[] = [];
  const flaggedTokens = new Set<string>();

  for (const irritant of IRRITANTS) {
    const hits = new Set<string>();
    for (const term of irritant.terms) {
      const needle = ` ${term.trim().toLowerCase()}`;
      // Match against each token so we can report which ingredient hit.
      for (const t of tokens) {
        if (t.normalized.includes(needle) || t.normalized.includes(term.trim().toLowerCase())) {
          hits.add(t.raw);
          flaggedTokens.add(t.raw);
        }
      }
      // Fallback: multiword terms that span tokenisation.
      if (hits.size === 0 && joined.includes(term.trim().toLowerCase())) {
        hits.add(term);
      }
    }
    if (hits.size > 0) {
      matches.push({ irritant, hits: [...hits] });
    }
  }

  // Category order for a stable, sensible display.
  const order: IrritantCategory[] = [
    "fragrance",
    "preservative",
    "surfactant",
    "alcohol",
    "botanical",
    "other",
  ];
  matches.sort((a, b) => order.indexOf(a.irritant.category) - order.indexOf(b.irritant.category));

  return {
    ingredientCount: tokens.length,
    matches,
    cleanCount: Math.max(0, tokens.length - flaggedTokens.size),
  };
}
