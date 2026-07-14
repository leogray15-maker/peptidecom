// Peptide reconstitution & dosing reference data + calculator maths.
// FOR RESEARCH / EDUCATIONAL PURPOSES ONLY. Not medical advice.

export interface PeptidePreset {
  slug: string;
  name: string;
  category: string;
  /** Common vial strengths in mg. */
  commonVialMg: number[];
  /** Typical research dose range in micrograms (mcg), for reference only. */
  typicalDoseMcg: [number, number];
  /** Typical dosing frequency, for reference only. */
  frequency: string;
  notes?: string;
  /** Reported elimination half-life, reference only (drives the library). */
  halfLife?: string;
  /** Typical administration route in research settings. */
  route?: string;
  /** RESEARCH_GOALS ids this compound is commonly run for. */
  goals?: string[];
  /** One-paragraph plain-English overview for the library. */
  description?: string;
  /** Also-known-as names / research codes. */
  aka?: string;
}

export const PEPTIDE_PRESETS: PeptidePreset[] = [
  {
    slug: "semaglutide",
    name: "Semaglutide",
    category: "GLP-1",
    commonVialMg: [2, 3, 5, 10],
    typicalDoseMcg: [250, 2400],
    frequency: "1x / week",
    notes: "GLP-1 receptor agonist. Titrated slowly over weeks.",
    halfLife: "~7 days (weekly dosing)",
    route: "Subcutaneous",
    goals: ["weight-loss"],
    aka: "Ozempic / Wegovy (licensed forms)",
    description:
      "GLP-1 receptor agonist studied for appetite regulation and weight loss. Slows gastric emptying and reduces hunger signalling; research protocols titrate the dose up slowly over weeks to manage GI side-effects.",
  },
  {
    slug: "tirzepatide",
    name: "Tirzepatide",
    category: "GLP-1 / GIP",
    commonVialMg: [5, 10, 15, 30, 60],
    typicalDoseMcg: [2500, 15000],
    frequency: "1x / week",
    notes: "Dual GIP/GLP-1 agonist. Titrated slowly.",
    halfLife: "~5 days (weekly dosing)",
    route: "Subcutaneous",
    goals: ["weight-loss"],
    aka: "Mounjaro / Zepbound (licensed forms)",
    description:
      "Dual GIP + GLP-1 receptor agonist. In trials it produced greater average weight loss than single-agonist GLP-1s; the dual action also affects insulin sensitivity. Titrated slowly, dosed weekly.",
  },
  {
    slug: "retatrutide",
    name: "Retatrutide",
    category: "GLP-1 / GIP / Glucagon",
    commonVialMg: [5, 10, 15, 20],
    typicalDoseMcg: [1000, 12000],
    frequency: "1x / week",
    notes: "Triple agonist. Research compound.",
    halfLife: "~6 days (weekly dosing)",
    route: "Subcutaneous",
    goals: ["weight-loss"],
    aka: "LY3437943, 'triple G' agonist",
    description:
      "Triple agonist (GIP + GLP-1 + glucagon receptors) in late-stage trials. The glucagon component adds an energy-expenditure effect on top of appetite suppression. Research-stage compound — long-term data is still limited.",
  },
  {
    slug: "bpc-157",
    name: "BPC-157",
    category: "Healing / Recovery",
    commonVialMg: [5, 10],
    typicalDoseMcg: [200, 500],
    frequency: "1-2x / day",
    notes: "Body Protection Compound.",
    halfLife: "Short (hours) — hence frequent dosing",
    route: "Subcutaneous (oral studied for gut)",
    goals: ["healing", "skin"],
    aka: "Body Protection Compound-157, PL 14736",
    description:
      "Pentadecapeptide derived from a gastric protein, studied in animal models for tendon, ligament, muscle and gut-lining repair. Human evidence is thin — most of what's known comes from preclinical work.",
  },
  {
    slug: "tb-500",
    name: "TB-500 (Thymosin Beta-4)",
    category: "Healing / Recovery",
    commonVialMg: [2, 5, 10],
    typicalDoseMcg: [2000, 5000],
    frequency: "2x / week",
    halfLife: "~1–3 days",
    route: "Subcutaneous",
    goals: ["healing", "muscle"],
    aka: "Thymosin Beta-4 fragment",
    description:
      "Synthetic fragment of thymosin beta-4, a protein involved in cell migration and tissue repair. Studied for injury recovery and inflammation; often run alongside BPC-157 in research stacks.",
  },
  {
    slug: "ghk-cu",
    name: "GHK-Cu",
    category: "Skin / Anti-aging",
    commonVialMg: [50, 100],
    typicalDoseMcg: [1000, 2000],
    frequency: "1x / day",
    notes: "Copper peptide.",
    halfLife: "Short (under an hour in plasma)",
    route: "Subcutaneous or topical",
    goals: ["skin", "healing"],
    aka: "Copper tripeptide GHK-Cu",
    description:
      "Naturally-occurring copper-binding tripeptide that declines with age. Studied for collagen synthesis, wound healing and skin remodelling — one of the better-evidenced cosmetic peptides, especially topically.",
  },
  {
    slug: "cjc-1295",
    name: "CJC-1295 (no DAC)",
    category: "Growth Hormone",
    commonVialMg: [2, 5],
    typicalDoseMcg: [100, 300],
    frequency: "1-3x / day",
    halfLife: "~30 minutes (no-DAC form)",
    route: "Subcutaneous",
    goals: ["muscle", "sleep"],
    aka: "Mod GRF 1-29",
    description:
      "Growth-hormone-releasing hormone analogue that stimulates the body's own GH pulse. The no-DAC form acts briefly, mimicking natural pulses; usually paired with ipamorelin and dosed before bed.",
  },
  {
    slug: "ipamorelin",
    name: "Ipamorelin",
    category: "Growth Hormone",
    commonVialMg: [2, 5, 10],
    typicalDoseMcg: [100, 300],
    frequency: "1-3x / day",
    halfLife: "~2 hours",
    route: "Subcutaneous",
    goals: ["muscle", "sleep", "healing"],
    aka: "NNC 26-0161",
    description:
      "Selective growth-hormone secretagogue (ghrelin-receptor agonist) with minimal effect on cortisol or appetite compared with older GHRPs. Commonly paired with CJC-1295 no-DAC in research protocols.",
  },
  {
    slug: "mots-c",
    name: "MOTS-c",
    category: "Metabolic",
    commonVialMg: [5, 10],
    typicalDoseMcg: [5000, 10000],
    frequency: "3x / week",
    halfLife: "Short (minutes in plasma)",
    route: "Subcutaneous",
    goals: ["energy", "weight-loss"],
    aka: "Mitochondrial ORF of the twelve S rRNA type-c",
    description:
      "Mitochondrially-encoded peptide studied for exercise capacity, insulin sensitivity and metabolic regulation. A newer research area — most data is preclinical or from small human studies.",
  },
  {
    slug: "custom",
    name: "Custom / other",
    category: "Other",
    commonVialMg: [5, 10],
    typicalDoseMcg: [100, 1000],
    frequency: "as required",
  },
];

export interface CalcInput {
  /** Peptide amount in the vial (mg). */
  vialMg: number;
  /** Bacteriostatic water added (ml). */
  bacWaterMl: number;
  /** Desired dose (mcg). */
  doseMcg: number;
  /** Syringe scale: units per ml. U-100 = 100, U-40 = 40, U-50 = 50. */
  syringeUnitsPerMl?: number;
}

export interface CalcResult {
  /** Concentration in mcg per ml. */
  concentrationMcgPerMl: number;
  /** Concentration in mg per ml. */
  concentrationMgPerMl: number;
  /** Volume to draw for the dose (ml). */
  drawMl: number;
  /** Volume to draw expressed in insulin-syringe units (IU / "ticks"). */
  drawUnits: number;
  /** How many full doses the vial contains. */
  dosesPerVial: number;
  valid: boolean;
  errors: string[];
}

/**
 * Reconstitution maths.
 *
 * concentration (mcg/ml) = vialMg * 1000 / bacWaterMl
 * drawMl                 = doseMcg / concentration
 * drawUnits (U-100)      = drawMl * 100
 */
export function calculateReconstitution(input: CalcInput): CalcResult {
  const { vialMg, bacWaterMl, doseMcg } = input;
  const unitsPerMl = input.syringeUnitsPerMl ?? 100;
  const errors: string[] = [];

  if (!(vialMg > 0)) errors.push("Vial strength (mg) must be greater than 0.");
  if (!(bacWaterMl > 0)) errors.push("Bacteriostatic water (ml) must be greater than 0.");
  if (!(doseMcg > 0)) errors.push("Desired dose (mcg) must be greater than 0.");

  if (errors.length) {
    return {
      concentrationMcgPerMl: 0,
      concentrationMgPerMl: 0,
      drawMl: 0,
      drawUnits: 0,
      dosesPerVial: 0,
      valid: false,
      errors,
    };
  }

  const concentrationMcgPerMl = (vialMg * 1000) / bacWaterMl;
  const concentrationMgPerMl = vialMg / bacWaterMl;
  const drawMl = doseMcg / concentrationMcgPerMl;
  const drawUnits = drawMl * unitsPerMl;
  const dosesPerVial = (vialMg * 1000) / doseMcg;

  if (drawUnits > unitsPerMl) {
    errors.push(
      `Draw volume (${drawUnits.toFixed(1)} units) exceeds one full ${unitsPerMl}-unit syringe. Consider more water or a smaller dose.`
    );
  }

  return {
    concentrationMcgPerMl,
    concentrationMgPerMl,
    drawMl,
    drawUnits,
    dosesPerVial,
    valid: true,
    errors,
  };
}

export const SYRINGE_TYPES = [
  { label: "U-100 (1ml = 100 units)", value: 100 },
  { label: "U-50 (0.5ml = 50 units)", value: 50 },
  { label: "U-40 (1ml = 40 units)", value: 40 },
];

// ─── Injection-site rotation ─────────────────────────────────────────────────
// Rotating sites reduces lipohypertrophy and irritation. The order below is a
// sensible clockwise rotation; the suggestion logic prefers whichever site
// this peptide has used least recently.

export const INJECTION_SITES = [
  { id: "abdomen-left", label: "Left abdomen" },
  { id: "abdomen-right", label: "Right abdomen" },
  { id: "thigh-left", label: "Left thigh" },
  { id: "thigh-right", label: "Right thigh" },
  { id: "glute-left", label: "Left glute" },
  { id: "glute-right", label: "Right glute" },
  { id: "arm-left", label: "Left arm" },
  { id: "arm-right", label: "Right arm" },
] as const;

export const siteLabel = (id?: string | null) =>
  INJECTION_SITES.find((s) => s.id === id)?.label ?? null;

/** Suggest the next injection site for a peptide: the least-recently-used
 * site (never-used sites first, in rotation order). Logs may be in any order;
 * logs without a site are ignored. Returns null if the member has never
 * recorded a site for this peptide — no point nagging about rotation then. */
export function suggestNextSite(
  logs: { date: string; peptide: string; site?: string | null }[],
  peptide: string
): { suggested: string; last: string; lastDate: string } | null {
  const name = peptide.trim().toLowerCase();
  const relevant = logs
    .filter((l) => l.peptide.trim().toLowerCase() === name && l.site)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (relevant.length === 0) return null;

  const lastUsed = new Map<string, string>(); // site → most recent date
  for (const l of relevant) {
    if (!lastUsed.has(l.site!)) lastUsed.set(l.site!, l.date);
  }
  // Rotation order, never-used first, then stalest.
  const ranked = [...INJECTION_SITES]
    .map((s, i) => ({ id: s.id, order: i, date: lastUsed.get(s.id) ?? "" }))
    .sort((a, b) => (a.date === b.date ? a.order - b.order : a.date.localeCompare(b.date)));

  return {
    suggested: ranked[0].id,
    last: relevant[0].site!,
    lastDate: relevant[0].date,
  };
}
