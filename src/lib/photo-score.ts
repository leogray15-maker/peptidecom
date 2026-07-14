// Tier A photo severity heuristic — 100% free, runs in the user's browser.
//
// COST POLICY (do not regress): this module must never call a paid vision
// API (no GPT-4V, no Claude vision, no Google Vision, no per-call billing of
// any kind). It is plain canvas pixel maths. The optional Tier B upgrade
// (src/lib/photo-model.ts) is a client-side TensorFlow.js model — also free
// at inference time. If higher accuracy is ever wanted, paid options need an
// explicitly approved budget first.
//
// How it works: sample the centre of the photo, convert pixels to HSV, and
// build an "inflammation proxy" from (a) the fraction of usable pixels whose
// hue sits in the red band with meaningful saturation, and (b) an erythema
// index (how much red exceeds the other channels). The proxy is scored 0–100,
// preferably relative to the user's own least-inflamed photo so skin tone and
// typical lighting cancel out. It is an ESTIMATE and the UI must always label
// it as one — it supplements the manual severity slider, never replaces it.
//
// The maths lives in pure functions over raw pixel arrays so it can be unit
// tested in Node (scripts/photo-score.test.ts); only extractImageFeatures at
// the bottom touches the DOM.

export const PHOTO_SCORE_VERSION = 1;

export interface PhotoFeatures {
  /** Share of usable pixels in the red-hue band with real saturation (0–1). */
  inflamedFraction: number;
  /** Mean erythema index: how much R exceeds the G/B average (0–1). */
  rednessIndex: number;
  /** Combined 0–1 proxy the score is derived from. */
  composite: number;
  /** How many sampled pixels were usable — low counts mean "don't trust it". */
  usableFraction: number;
}

export interface PhotoEstimate {
  score: number; // 0–100
  composite: number;
  inflamedFraction: number;
  rednessIndex: number;
  version: number;
  method: "heuristic" | "tfjs" | "blended";
}

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

// Tuning constants for the inflammation proxy.
const RED_HUE_MAX = 25; // 0–25° …
const RED_HUE_MIN = 345; // … and 345–360° count as the red band
const MIN_SATURATION = 0.25; // pale pink below this isn't counted as inflamed
const MIN_VALUE = 0.15; // ignore deep shadow
const MAX_VALUE = 0.98; // ignore blown highlights
const REDNESS_NORM = 0.22; // rednessIndex at/above this maps to 1.0
/** Sampled-pixel floor below which the photo is too dark/blown to score. */
const MIN_USABLE_FRACTION = 0.2;

/** Extract features from raw RGBA pixel data (pure — Node-testable).
 * Samples the centre 70% of the frame so background edges don't dominate. */
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
      rednessSum += Math.max(0, r - (g + b) / 2) / 255;
      const redHue = h <= RED_HUE_MAX || h >= RED_HUE_MIN;
      if (redHue && s >= MIN_SATURATION) inflamed++;
    }
  }

  const inflamedFraction = usable > 0 ? inflamed / usable : 0;
  const rednessIndex = usable > 0 ? rednessSum / usable : 0;
  const rNorm = Math.min(1, rednessIndex / REDNESS_NORM);
  return {
    inflamedFraction,
    rednessIndex,
    composite: 0.55 * inflamedFraction + 0.45 * rNorm,
    usableFraction: sampled > 0 ? usable / sampled : 0,
  };
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** 0–100 estimate. With a baseline (the user's own least-inflamed photo) the
 * score is relative — baseline lands near 12 so "your calmest" isn't claimed
 * to be zero inflammation. Without one, an absolute mapping is used. Returns
 * null when the photo is too dark/blown-out to judge. */
export function scorePhoto(
  features: PhotoFeatures,
  baseline: { composite: number } | null
): number | null {
  if (features.usableFraction < MIN_USABLE_FRACTION) return null;
  if (baseline) {
    return Math.round(clamp(12 + 140 * (features.composite - baseline.composite), 0, 100));
  }
  return Math.round(clamp(100 * features.composite, 0, 100));
}

/** Pick the baseline from previously-scored photos: the least-inflamed one.
 * Prefers photos of the same body area (skin tone/lighting comparability),
 * falls back to any scored photo. */
export function pickBaseline<T extends { composite: number; area?: string | null }>(
  scored: T[],
  area: string | null
): T | null {
  if (scored.length === 0) return null;
  const pool = area ? scored.filter((p) => p.area === area) : [];
  const usePool = pool.length > 0 ? pool : scored;
  return usePool.reduce((min, p) => (p.composite < min.composite ? p : min), usePool[0]);
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
