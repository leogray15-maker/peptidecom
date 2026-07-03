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
  },
  {
    slug: "tirzepatide",
    name: "Tirzepatide",
    category: "GLP-1 / GIP",
    commonVialMg: [5, 10, 15, 30, 60],
    typicalDoseMcg: [2500, 15000],
    frequency: "1x / week",
    notes: "Dual GIP/GLP-1 agonist. Titrated slowly.",
  },
  {
    slug: "retatrutide",
    name: "Retatrutide",
    category: "GLP-1 / GIP / Glucagon",
    commonVialMg: [5, 10, 15, 20],
    typicalDoseMcg: [1000, 12000],
    frequency: "1x / week",
    notes: "Triple agonist. Research compound.",
  },
  {
    slug: "bpc-157",
    name: "BPC-157",
    category: "Healing / Recovery",
    commonVialMg: [5, 10],
    typicalDoseMcg: [200, 500],
    frequency: "1-2x / day",
    notes: "Body Protection Compound.",
  },
  {
    slug: "tb-500",
    name: "TB-500 (Thymosin Beta-4)",
    category: "Healing / Recovery",
    commonVialMg: [2, 5, 10],
    typicalDoseMcg: [2000, 5000],
    frequency: "2x / week",
  },
  {
    slug: "ghk-cu",
    name: "GHK-Cu",
    category: "Skin / Anti-aging",
    commonVialMg: [50, 100],
    typicalDoseMcg: [1000, 2000],
    frequency: "1x / day",
    notes: "Copper peptide.",
  },
  {
    slug: "cjc-1295",
    name: "CJC-1295 (no DAC)",
    category: "Growth Hormone",
    commonVialMg: [2, 5],
    typicalDoseMcg: [100, 300],
    frequency: "1-3x / day",
  },
  {
    slug: "ipamorelin",
    name: "Ipamorelin",
    category: "Growth Hormone",
    commonVialMg: [2, 5, 10],
    typicalDoseMcg: [100, 300],
    frequency: "1-3x / day",
  },
  {
    slug: "mots-c",
    name: "MOTS-c",
    category: "Metabolic",
    commonVialMg: [5, 10],
    typicalDoseMcg: [5000, 10000],
    frequency: "3x / week",
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
