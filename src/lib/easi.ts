// EASI — Eczema Area and Severity Index.
//
// Pure, dependency-free maths so it can be unit-tested in Node
// (scripts/easi.test.ts) and imported from client components. No server-only
// deps, no network, no paid APIs.
//
// The EASI is a validated clinician score (Hanifin et al., 2001). It is used
// here as a structured self-assessment aid — the UI must always label it as
// educational, not a diagnosis. Range 0–72.
//
// For each of four body regions:
//   • an AREA score 0–6 (how much of that region is affected), and
//   • four SIGN severities 0–3 (erythema, oedema/papulation, excoriation,
//     lichenification).
// Region contribution = areaScore × (sum of the four signs) × regionMultiplier.
// Adult multipliers: head/neck 0.1, trunk 0.3, upper limbs 0.2, lower limbs 0.4.
// (Children 0–7 use head/neck 0.2 and lower limbs 0.4·… — we use the adult set,
// which is the standard for the self-tracking audience here.)

export interface EasiRegion {
  id: "head" | "trunk" | "upper" | "lower";
  label: string;
  /** Body-surface weighting used by the EASI for this region (adult). */
  multiplier: number;
}

export const EASI_REGIONS: EasiRegion[] = [
  { id: "head", label: "Head & neck", multiplier: 0.1 },
  { id: "trunk", label: "Trunk", multiplier: 0.3 },
  { id: "upper", label: "Upper limbs", multiplier: 0.2 },
  { id: "lower", label: "Lower limbs", multiplier: 0.4 },
];

export const EASI_SIGNS = [
  { id: "erythema", label: "Redness", hint: "Erythema — how red/inflamed" },
  { id: "edema", label: "Swelling", hint: "Oedema / papulation — raised or bumpy" },
  { id: "excoriation", label: "Scratching", hint: "Excoriation — scratch marks, broken skin" },
  { id: "lichenification", label: "Thickening", hint: "Lichenification — leathery, thickened skin" },
] as const;

export type EasiSignId = (typeof EASI_SIGNS)[number]["id"];

/** Area category 0–6 → the % band it represents (for the picker labels). */
export const EASI_AREA_BANDS: { value: number; label: string }[] = [
  { value: 0, label: "0% — clear" },
  { value: 1, label: "1–9%" },
  { value: 2, label: "10–29%" },
  { value: 3, label: "30–49%" },
  { value: 4, label: "50–69%" },
  { value: 5, label: "70–89%" },
  { value: 6, label: "90–100%" },
];

export const EASI_SIGN_BANDS: { value: number; label: string }[] = [
  { value: 0, label: "None" },
  { value: 1, label: "Mild" },
  { value: 2, label: "Moderate" },
  { value: 3, label: "Severe" },
];

export interface EasiRegionInput {
  area: number; // 0–6
  signs: Record<EasiSignId, number>; // each 0–3
}

export type EasiInput = Record<EasiRegion["id"], EasiRegionInput>;

export function emptyRegionInput(): EasiRegionInput {
  return {
    area: 0,
    signs: { erythema: 0, edema: 0, excoriation: 0, lichenification: 0 },
  };
}

export function emptyEasiInput(): EasiInput {
  return {
    head: emptyRegionInput(),
    trunk: emptyRegionInput(),
    upper: emptyRegionInput(),
    lower: emptyRegionInput(),
  };
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Contribution of a single region to the total EASI (0 up to region max). */
export function regionScore(region: EasiRegion, input: EasiRegionInput): number {
  const area = clamp(Math.round(input.area), 0, 6);
  const signSum = EASI_SIGNS.reduce(
    (sum, s) => sum + clamp(Math.round(input.signs[s.id] ?? 0), 0, 3),
    0
  );
  return area * signSum * region.multiplier;
}

/** Total EASI 0–72, rounded to 1 decimal place. */
export function easiScore(input: EasiInput): number {
  const total = EASI_REGIONS.reduce(
    (sum, region) => sum + regionScore(region, input[region.id]),
    0
  );
  return Math.round(total * 10) / 10;
}

export interface EasiBand {
  label: string;
  /** Tailwind text colour token for the badge. */
  tone: "emerald" | "amber" | "orange" | "rose";
  blurb: string;
}

/** Standard EASI severity strata (Leshem et al., 2015 banding). */
export function easiBand(score: number): EasiBand {
  if (score === 0)
    return { label: "Clear", tone: "emerald", blurb: "No active eczema scored." };
  if (score <= 1.0)
    return { label: "Almost clear", tone: "emerald", blurb: "Barely any active disease." };
  if (score <= 7.0)
    return { label: "Mild", tone: "amber", blurb: "Mild eczema on this assessment." };
  if (score <= 21.0)
    return { label: "Moderate", tone: "orange", blurb: "Moderate eczema on this assessment." };
  if (score <= 50.0)
    return { label: "Severe", tone: "rose", blurb: "Severe eczema on this assessment." };
  return { label: "Very severe", tone: "rose", blurb: "Very severe eczema on this assessment." };
}

export const EASI_MAX = 72;
