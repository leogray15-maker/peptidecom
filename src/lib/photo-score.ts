// Tier A photo severity heuristic — 100% free, runs in the user's browser.
//
// COST POLICY (do not regress): this module must never call a paid vision
// API (no GPT-4V, no Claude vision, no Google Vision, no per-call billing of
// any kind). It is plain canvas pixel maths. The optional Tier B upgrade
// (src/lib/photo-model.ts) is a client-side TensorFlow.js model — also free
// at inference time. If higher accuracy is ever wanted, paid options need an
// explicitly approved budget first.
//
// How it works, in order:
//   1. Sample the centre of the photo and throw away pixels that are deep
//      shadow or blown highlight.
//   2. Of what's left, keep only pixels that look like SKIN (warm hue, some
//      saturation, red above blue). Bedding, clothing, walls and worktops are
//      dropped, so a patch photographed against a grey towel isn't diluted by
//      the towel.
//   3. Within the skin pixels, measure (a) the share reading as actively
//      inflamed and (b) an erythema ratio (R−G)/(R+G), which separates flare
//      from normal skin far better than R−(G+B)/2 does across skin tones.
//   4. Score the resulting 0–1 composite, preferably against the member's own
//      calm photo so their skin tone and usual lighting cancel out.
//
// It is an ESTIMATE and the UI must always label it as one — it supplements
// the manual severity slider, never replaces it.
//
// The maths lives in pure functions over raw pixel arrays so it can be unit
// tested in Node (scripts/photo-score.test.ts); only extractImageFeatures at
// the bottom touches the DOM.
//
// VERSION 2 (2026-08): v1 scored every pixel in the centre crop, including
// background, and used an erythema index that read normal mid- and deep-toned
// skin as ~85–95/100. It also accepted ANY previously-saved photo as the
// "calm" baseline, so a member whose only saved photos were flares had every
// flare scored against a flare — the reported case where an obviously raw arm
// came back "Calm 0/100". A v1 composite is not comparable to a v2 one, so
// baselines are version-gated below.

export const PHOTO_SCORE_VERSION = 2;

export interface PhotoFeatures {
  /** Weighted share of SKIN pixels reading as actively inflamed (0–1). */
  inflamedFraction: number;
  /** Mean erythema ratio (R−G)/(R+G) over skin pixels (0–1). */
  rednessIndex: number;
  /** Combined 0–1 proxy the score is derived from. */
  composite: number;
  /** Sampled pixels that weren't shadow or blown highlight (0–1). */
  usableFraction: number;
  /** Usable pixels that looked like skin (0–1) — low means mostly background. */
  skinFraction: number;
}

export interface PhotoEstimate {
  score: number; // 0–100
  composite: number;
  inflamedFraction: number;
  rednessIndex: number;
  version: number;
  method: "heuristic" | "tfjs" | "blended";
  /** Whether the score is relative to the member's own calm photo. */
  basis?: ScoreBasis;
}

export type ScoreBasis = "baseline" | "absolute";

/** Why a photo couldn't be graded, so the UI can give specific advice. */
export type PhotoRejection = "too-dark" | "too-little-skin";

export type PhotoGrade =
  | { ok: true; score: number; basis: ScoreBasis }
  | { ok: false; reason: PhotoRejection };

/** RGB (0–255) → [hue 0–360, saturation 0–1, value 0–1]. */
export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / d + 2);
    else h = 60 * ((rn - gn) / d + 4);
  }
  if (h < 0) h += 360;
  return [h, max === 0 ? 0 : d / max, max];
}

// ── Tuning constants ───────────────────────────────────────────────────────
// Exposure gate: what counts as a readable pixel at all.
const MIN_VALUE = 0.15; // ignore deep shadow
const MAX_VALUE = 0.98; // ignore blown highlights

// Skin gate: skin of every tone is a warm, R > G > B colour. Bedding, denim,
// walls and worktops are usually grey/blue/green or near-desaturated, so this
// removes most background without needing a model.
const SKIN_HUE_MAX = 50; // 0–50° …
const SKIN_HUE_MIN = 330; // … and 330–360° are the warm band
const SKIN_MIN_SATURATION = 0.1; // greys, whites and near-neutrals are not skin
const SKIN_MIN_RB_GAP = 10; // R must lead B by this much (0–255)

// Inflammation gate, applied only to skin pixels. Hue and saturation are hard
// gates (a pixel is in the red band or it isn't); erythema is a RAMP, because
// a hard threshold there put a cliff in the middle of the skin-tone range —
// 0.158 read as 0% inflamed and 0.200 as 100%, a 60-point swing between two
// neighbouring shades of perfectly normal deep-toned skin. Ramping also stops
// the hue boundary deciding a photo on its own: a pixel that sneaks under
// RED_HUE_MAX still contributes nothing unless it is genuinely red.
const RED_HUE_MAX = 25; // 0–25° …
const RED_HUE_MIN = 345; // … and 345–360° count as the red band
const MIN_SATURATION = 0.25; // pale pink below this isn't counted as inflamed
const INFLAMED_REDNESS_LO = 0.16; // (R−G)/(R+G) where "inflamed" starts to count
const INFLAMED_REDNESS_HI = 0.34; // … and where a pixel counts fully

/** Erythema ratio at/above which rednessIndex maps to 1.0. Calibrated so
 * normal skin lands ~0.19–0.45 of the scale across tones and frank erythema
 * saturates it, without moderate redness pinning to 100 straight away. */
const REDNESS_NORM = 0.45;

/** Sampled-pixel floor below which the photo is too dark/blown to score. */
const MIN_USABLE_FRACTION = 0.2;
/** Skin-pixel floor below which we're mostly grading the background. */
const MIN_SKIN_FRACTION = 0.25;

/** Where a member's own calm photo is anchored on the 0–100 scale — their
 * calmest skin is "as good as it gets for them", not "zero inflammation". */
const BASELINE_ANCHOR = 12;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Erythema ratio (R−G)/(R+G): brightness-tolerant, so it separates flare from
 * normal skin across tones far better than R−(G+B)/2. Clamped at 0. */
export function erythemaRatio(r: number, g: number): number {
  const sum = r + g;
  return sum <= 0 ? 0 : Math.max(0, (r - g) / sum);
}

/** True when a pixel plausibly belongs to skin rather than background. */
function isSkinLike(h: number, s: number, r: number, b: number): boolean {
  if (s < SKIN_MIN_SATURATION) return false;
  if (r - b < SKIN_MIN_RB_GAP) return false;
  return h <= SKIN_HUE_MAX || h >= SKIN_HUE_MIN;
}

/** How strongly a skin pixel reads as inflamed, 0–1 (see the ramp note above). */
export function inflamedWeight(h: number, s: number, redness: number): number {
  const redHue = h <= RED_HUE_MAX || h >= RED_HUE_MIN;
  if (!redHue || s < MIN_SATURATION) return 0;
  return clamp((redness - INFLAMED_REDNESS_LO) / (INFLAMED_REDNESS_HI - INFLAMED_REDNESS_LO), 0, 1);
}

/** Extract features from raw RGBA pixel data (pure — Node-testable).
 * Samples the centre 70% of the frame so background edges don't dominate,
 * then restricts the measurement to skin-like pixels within it. */
export function computePhotoFeatures(
  data: Uint8ClampedArray,
  width: number,
  height: number
): PhotoFeatures {
  const x0 = Math.floor(width * 0.15);
  const x1 = Math.ceil(width * 0.85);
  const y0 = Math.floor(height * 0.15);
  const y1 = Math.ceil(height * 0.85);
  // Stride keeps the sample around ≤40k pixels regardless of image size.
  const region = (x1 - x0) * (y1 - y0);
  const stride = Math.max(1, Math.floor(Math.sqrt(region / 40_000)));

  let sampled = 0;
  let usable = 0;
  let skin = 0;
  let inflamed = 0;
  let rednessSum = 0;

  for (let y = y0; y < y1; y += stride) {
    for (let x = x0; x < x1; x += stride) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      sampled++;
      const [h, s, v] = rgbToHsv(r, g, b);
      if (v < MIN_VALUE || v > MAX_VALUE) continue;
      usable++;
      if (!isSkinLike(h, s, r, b)) continue;
      skin++;

      const redness = erythemaRatio(r, g);
      rednessSum += redness;
      inflamed += inflamedWeight(h, s, redness);
    }
  }

  const inflamedFraction = skin > 0 ? inflamed / skin : 0;
  const rednessIndex = skin > 0 ? rednessSum / skin : 0;
  const rNorm = Math.min(1, rednessIndex / REDNESS_NORM);
  return {
    inflamedFraction,
    rednessIndex,
    composite: 0.55 * inflamedFraction + 0.45 * rNorm,
    usableFraction: sampled > 0 ? usable / sampled : 0,
    skinFraction: usable > 0 ? skin / usable : 0,
  };
}

/** Why the photo can't be graded, or null when it's fine. */
export function rejectPhoto(features: PhotoFeatures): PhotoRejection | null {
  if (features.usableFraction < MIN_USABLE_FRACTION) return "too-dark";
  if (features.skinFraction < MIN_SKIN_FRACTION) return "too-little-skin";
  return null;
}

/** 0–100 estimate.
 *
 * With a trusted baseline (see pickBaseline — the member's own photo from a day
 * they rated calm) the score is relative: the baseline lands on
 * BASELINE_ANCHOR and the remaining headroom is stretched over what's left of
 * the composite range. Normalising by headroom means a member whose calm skin
 * already reads warm still gets the full 0–100 range for their flares, and it
 * keeps the relative and absolute scales roughly agreeing for pale skin, so
 * earning a baseline doesn't lurch the number.
 *
 * Without a trusted baseline it falls back to the absolute mapping rather than
 * comparing against an arbitrary earlier photo — a flare is not "calm" just
 * because a worse flare was saved first. */
export function scorePhoto(
  features: PhotoFeatures,
  baseline: { composite: number } | null
): PhotoGrade {
  const reason = rejectPhoto(features);
  if (reason) return { ok: false, reason };
  if (baseline) {
    const headroom = Math.max(0.15, 1 - baseline.composite);
    const rel = BASELINE_ANCHOR + (100 - BASELINE_ANCHOR) * ((features.composite - baseline.composite) / headroom);
    return { ok: true, score: Math.round(clamp(rel, 0, 100)), basis: "baseline" };
  }
  return { ok: true, score: Math.round(clamp(100 * features.composite, 0, 100)), basis: "absolute" };
}

/** Manual severity (1–10) at or below which a logged day counts as calm enough
 * for its photo to serve as a baseline. */
export const CALM_MANUAL_SEVERITY = 4;

export interface BaselineCandidate {
  composite: number;
  area?: string | null;
  takenAt?: string;
  version?: number;
}

/** Pick the baseline: the least-inflamed photo the member took ON A DAY THEY
 * THEMSELVES RATED CALM. Prefers the same body area (skin tone and lighting
 * comparability) and falls back to any calm-day photo.
 *
 * The member's own rating is the gate, not the photo's own redness — that's
 * the whole point. Using "least red photo so far" meant someone who only ever
 * photographs flares had every flare scored against a flare, which is how an
 * obviously raw patch came back as "Calm". Photos with no logged rating, and
 * photos scored by an older version of the heuristic (whose composite isn't
 * comparable), are not eligible; the caller then falls back to the absolute
 * scale, which is honest about what it knows. */
export function pickBaseline<T extends BaselineCandidate>(
  scored: T[],
  area: string | null,
  manualSeverityByDate: Record<string, number> = {}
): T | null {
  const calm = scored.filter((p) => {
    if (p.version !== PHOTO_SCORE_VERSION) return false;
    if (!p.takenAt) return false;
    const manual = manualSeverityByDate[p.takenAt];
    return manual != null && manual <= CALM_MANUAL_SEVERITY;
  });
  if (calm.length === 0) return null;
  const pool = area ? calm.filter((p) => p.area === area) : [];
  const usePool = pool.length > 0 ? pool : calm;
  return usePool.reduce((min, p) => (p.composite < min.composite ? p : min), usePool[0]);
}

export interface FlareBand {
  label: string;
  /** Shared tone vocabulary with the scanner's score ring. */
  tone: "emerald" | "green" | "orange" | "rose";
  blurb: string;
}

/** Plain-English band for a 0–100 estimate. Unlike the product scores, HIGHER
 * is worse here, so the tones run the other way. Deliberately coarse — the
 * heuristic can't justify finer distinctions than "calm / mild / moderate". */
export function flareBand(score: number): FlareBand {
  if (score <= 20)
    return { label: "Calm", tone: "emerald", blurb: "Very little visible inflammation in this photo." };
  if (score <= 40)
    return { label: "Mild", tone: "green", blurb: "Some redness, on the milder end." };
  if (score <= 65)
    return { label: "Moderate", tone: "orange", blurb: "Clear redness across much of the patch." };
  return { label: "Marked", tone: "rose", blurb: "Strong, widespread redness in this photo." };
}

/** Agreement between the heuristic and the user's own manual ratings, so the
 * estimate can be validated before anyone treats it as authoritative.
 * Pairs each scored photo with the manual severity logged for the same date. */
export function estimateAgreement(
  pairs: [number, number][] // [estimate 0–100, manual severity 1–10]
): { n: number; r: number } | null {
  if (pairs.length < 5) return null;
  const r = pearsonLocal(pairs);
  return r == null ? null : { n: pairs.length, r: Math.round(r * 100) / 100 };
}

// Local copy to keep this module dependency-free for tests; same maths as
// lib/insights pearson but with the pair-count floor of 5 handled above.
function pearsonLocal(pairs: [number, number][]): number | null {
  const n = pairs.length;
  const mx = pairs.reduce((s, p) => s + p[0], 0) / n;
  const my = pairs.reduce((s, p) => s + p[1], 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (const [x, y] of pairs) {
    num += (x - mx) * (y - my);
    dx += (x - mx) ** 2;
    dy += (y - my) ** 2;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

// ─── Browser-only extraction (thin DOM wrapper over the pure maths) ─────────

/** Decode a data-URL image and compute its features via an offscreen canvas.
 * Browser only. Zero network calls. */
export async function extractImageFeatures(dataUrl: string): Promise<PhotoFeatures> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Couldn't read that image."));
    el.src = dataUrl;
  });
  // Downscale before sampling — features are scale-invariant and this keeps
  // getImageData cheap on phones.
  const maxDim = 512;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return computePhotoFeatures(data, canvas.width, canvas.height);
}
