// Tier A photo severity heuristic — 100% free, runs in the user's browser.
//
// COST POLICY (do not regress): this module must never call a paid vision
// API (no GPT-4V, no Claude vision, no Google Vision, no per-call billing of
// any kind). It is plain canvas pixel maths. The optional Tier B upgrade
// (src/lib/photo-model.ts) is a client-side TensorFlow.js model — also free
// at inference time. If higher accuracy is ever wanted, paid options need an
// explicitly approved budget first.
//
// It is an ESTIMATE and the UI must always label it as one — it supplements
// the manual severity slider, never replaces it.
//
// The maths lives in pure functions over raw pixel arrays so it can be unit
// tested in Node (scripts/photo-score.test.ts); only extractImageFeatures at
// the bottom touches the DOM.
//
// ─────────────────────────────────────────────────────────────────────────────
// VERSION 3 (2026-08) — why the numbers moved
//
// v2 averaged erythema over every "skin" pixel in the frame and mapped that
// mean straight onto 0–100. Three failures fell out of that, and a member hit
// all three at once with a photo of a badly crusted face and neck that came
// back "Calm 12/100":
//
//   1. MEAN OVER THE WHOLE FRAME. A flare is a PATCH. Averaging it together
//      with every calm pixel in shot is a strictly worse measurement the more
//      normal skin you include, so a raw patch on a face full of normal skin
//      reads calm. v3 measures percentiles instead: how red the worst of the
//      skin is (p85), how red that member's own quiet skin is in the SAME
//      frame (p20), and how much of the skin sits above their own quiet level.
//      Intensity and extent are then combined the way clinical indices do it
//      (EASI et al. multiply severity by area) rather than blurred together.
//
//   2. HAIR COUNTED AS SKIN. Brown and black hair is a warm, low-saturation,
//      R > G > B colour — it sailed through the v2 skin gate, then dragged the
//      mean down hard on any photo of a face, scalp, beard or forearm. v3
//      drops candidates that are dark relative to the rest of the skin in the
//      frame, which is what actually separates hair and cast shadow from skin
//      of ANY tone (the test is relative, so deep skin isn't penalised).
//
//   3. COLOUR ONLY. Crusting, scale, excoriation and lichenification are what
//      make a flare look severe, and none of them are red. v3 adds a texture
//      index — mean local luminance gradient inside the skin mask — which
//      rises on broken, scaly, weeping skin and stays near zero on smooth
//      skin. It can only ADD to the score, and only where there is already
//      some erythema, so beard stubble and freckles can't invent a flare.
//
// Also new in v3: a second colour channel (CIELAB a*) so inflammation that
// presents violet or grey-brown on deeper skin still registers, and an honest
// per-photo confidence with the reasons attached.
//
// v3 composites are NOT comparable to v2 ones, so v2 baselines are rejected
// by pickBaseline via the version gate.
//
// VERSION 2 (2026-08): v1 scored every pixel in the centre crop, including
// background, and used an erythema index that read normal mid- and deep-toned
// skin as ~85–95/100. It also accepted ANY previously-saved photo as the
// "calm" baseline, so a member whose only saved photos were flares had every
// flare scored against a flare — the reported case where an obviously raw arm
// came back "Calm 0/100".

export const PHOTO_SCORE_VERSION = 3;

/** Things about the photo itself that make the estimate less trustworthy.
 * Surfaced to the member rather than silently folded into the number. */
export type PhotoQualityFlag =
  | "low-light"
  | "blown-highlights"
  | "uneven-light"
  | "partly-unreadable"
  | "small-patch"
  | "deep-tone";

export type PhotoConfidence = "good" | "moderate" | "low";

export interface PhotoFeatures {
  /** Weighted share of measured skin reading as actively inflamed (0–1).
   * "Inflamed" means redder than this member's own quiet skin in the same
   * frame, or red in absolute terms — whichever is the lower bar. */
  inflamedFraction: number;
  /** How red the worst of the skin is: p85 of the erythema ratio (0–1). */
  rednessIndex: number;
  /** p85 − p20 of the erythema ratio: how far the flare stands out from this
   * member's own quiet skin in the same photo. Self-normalising, so skin tone,
   * lighting and camera white balance largely cancel. */
  erythemaContrast: number;
  /** Mean local luminance gradient inside the skin mask, normalised 0–1.
   * Smooth skin ≈ 0; scale, crust and excoriation push it up. */
  textureIndex: number;
  /** Combined 0–1 proxy the score is derived from. */
  composite: number;
  /** Sampled pixels that weren't shadow or blown highlight (0–1). */
  usableFraction: number;
  /** Share of usable pixels that read as plausible skin of any tone (0–1); low
   * means mostly background. Gates the non-skin rejection — see rejectPhoto
   * (in-app) and isLikelySkinPhoto (the server/edge gate). Deliberately the
   * GENEROUS colour-only mask, unchanged from v2, so this number keeps meaning
   * the same thing to the abuse gate and to the edge Worker's port of it. */
  skinFraction: number;
  /** Share of usable pixels actually measured, i.e. skin left after hair,
   * shadow and highlight are dropped. Always ≤ skinFraction. */
  measuredFraction: number;
  /** How many pixels the measurement is actually based on. */
  measuredPixels: number;
  /** Median L* of the measured skin (0–100). Drives the deep-tone caveat. */
  skinLightness: number;
  confidence: PhotoConfidence;
  qualityFlags: PhotoQualityFlag[];
}

export interface PhotoEstimate {
  score: number; // 0–100
  composite: number;
  inflamedFraction: number;
  rednessIndex: number;
  /** v3+. Absent on estimates saved before the contrast channel existed. */
  erythemaContrast?: number;
  /** v3+. Absent on estimates saved before texture was measured. */
  textureIndex?: number;
  /** v3+. How much the photo itself can support. */
  confidence?: PhotoConfidence;
  qualityFlags?: PhotoQualityFlag[];
  version: number;
  method: "heuristic" | "tfjs" | "blended";
  /** Which model produced this number (lib/ai-grading.ts modelIdFor). Stored
   * so a historical grading stays attributable after the maths or the local
   * model changes. Absent on estimates made before this was recorded. */
  modelId?: string;
  /** The disclaimer version the member accepted when this was graded.
   * Historical values are never rewritten — see RETROACTIVE_RELABEL_POLICY. */
  consentVersion?: number;
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
const MIN_VALUE = 0.12; // ignore deep shadow
const MAX_VALUE = 0.99; // ignore blown highlights

// Skin gate (colour only). Skin of every tone is a warm, R > G > B colour.
// Bedding, denim, walls and worktops are usually grey/blue/green or
// near-desaturated, so this removes most background without needing a model.
const SKIN_HUE_MAX = 50; // 0–50° …
const SKIN_HUE_MIN = 330; // … and 330–360° are the warm band
const SKIN_MIN_SATURATION = 0.1; // greys, whites and near-neutrals are not skin
const SKIN_MAX_SATURATION = 0.88; // above this it's a red jumper, not a person
const SKIN_MIN_RB_GAP = 8; // R must lead B by this much (0–255)

// Hair / cast-shadow gate, applied after the colour gate. Both tests are
// RELATIVE to the median lightness of the candidate skin in this frame, so a
// deep skin tone is never penalised for being dark — only for being much
// darker than the rest of the skin beside it.
const HAIR_LIGHTNESS_RATIO = 0.5; // below half the median L* → hair or shadow
/** …unless the pixel is frankly red, in which case it's a dark crust or a
 * deep bruise-coloured plaque and must be kept. Auburn hair is the reason
 * this still has a floor of its own. */
const DARK_KEEP_ERYTHEMA = 0.25;
const DARK_KEEP_LIGHTNESS_RATIO = 0.35;

// Erythema. The ratio (R−G)/(R+G) is brightness-tolerant, so it separates
// flare from normal skin across tones far better than R−(G+B)/2.
//
// INTENSITY has two independent routes to a high number, and takes the better
// of them:
//   · CONTRAST — how far the worst skin (p85) sits above this member's own
//     quiet skin (p20) in the SAME photo. Self-normalising: skin tone, bulb
//     colour and white balance are shared by both percentiles and cancel.
//   · ABSOLUTE — how red the worst skin is on its own. Carries the case where
//     the flare fills the frame and there is no quiet skin to compare with,
//     which is exactly when contrast collapses to zero.
const CONTRAST_LO = 0.06; // normal skin varies this much (knuckles, cheeks)
const CONTRAST_HI = 0.22;
const ABSOLUTE_LO = 0.16;
const ABSOLUTE_HI = 0.46;

/** CIELAB a* contrast, the same idea in a second colour space. Inflammation on
 * deeper skin often shows as violet or grey-brown, which moves a* while barely
 * moving (R−G)/(R+G). Weighted slightly below the erythema routes because a*
 * also picks up ordinary pigment variation. */
const A_CONTRAST_LO = 2.5;
const A_CONTRAST_HI = 14;
const A_CONTRAST_WEIGHT = 0.9;

/** A pixel counts as involved when it clears its member's own quiet skin by
 * this margin, OR clears the absolute bar — whichever is lower. The `min` is
 * what makes a frame that is ENTIRELY flare read as 100% involved instead of
 * 0%: with no quiet skin in shot the relative bar is unreachable. */
const INVOLVED_MARGIN = 0.06;
const INVOLVED_ABSOLUTE = 0.22;
/** Ramp width above the threshold, so the involved fraction climbs smoothly
 * instead of flipping a pixel on at a hard edge. Wide on purpose: with a hard
 * edge, two adjacent shades of the same flush landed 30 points apart. */
const INVOLVED_RAMP = 0.16;

/** Texture is a BONUS on top of erythema, never a component of it — a flat,
 * frankly red patch is a severe flare with no texture at all, and smooth
 * normal skin must not creep upwards because the camera was noisy. */
const TEXTURE_LO = 0.02; // smooth skin, JPEG noise included
const TEXTURE_HI = 0.1; // heavy scale / crust / excoriation
const TEXTURE_BONUS_MAX = 0.22;
/** Texture only scales in once there is some erythema to modify. Stubble,
 * freckles and moles are textured and are not flares. */
const TEXTURE_GATE = 0.2;

/** Extent shapes the score but never zeroes it — a small patch that is
 * genuinely raw still matters. 0.35 is what a pinpoint patch keeps. */
const EXTENT_FLOOR = 0.35;
/** Sub-linear so the first few percent of involvement register properly. */
const EXTENT_CURVE = 0.6;
/** Slight compression at the top of the intensity scale. */
const INTENSITY_CURVE = 0.85;

/** Sampled-pixel floor below which the photo is too dark/blown to score. */
const MIN_USABLE_FRACTION = 0.2;
/** Skin-pixel floor below which we're mostly grading the background. */
const MIN_SKIN_FRACTION = 0.25;
/** Too few pixels survive hair/shadow removal to say anything at all. */
const MIN_MEASURED_PIXELS = 150;

/** Where a member's own calm photo is anchored on the 0–100 scale — their
 * calmest skin is "as good as it gets for them", not "zero inflammation". */
const BASELINE_ANCHOR = 12;

/** Roughly 40k measured pixels regardless of input size, which also keeps the
 * texture measurement scale-invariant: the sample grid is always ~200×200, so
 * "gradient between neighbouring samples" means the same thing on a 12MP
 * photo as on a thumbnail. */
const SAMPLE_TARGET = 40_000;
/** Sample the middle 90% of each side. Wide enough not to clip an off-centre
 * patch (v2's 70% crop lost flares at the edge of the frame), tight enough to
 * shed the frame border where backgrounds live. */
const CROP = 0.05;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
/** Linear 0→1 ramp between lo and hi, flat outside. */
const ramp = (n: number, lo: number, hi: number) => clamp((n - lo) / (hi - lo), 0, 1);

/** Erythema ratio (R−G)/(R+G): brightness-tolerant, so it separates flare from
 * normal skin across tones far better than R−(G+B)/2. Clamped at 0. */
export function erythemaRatio(r: number, g: number): number {
  const sum = r + g;
  return sum <= 0 ? 0 : Math.max(0, (r - g) / sum);
}

/** True when a pixel plausibly belongs to skin rather than background, on
 * colour alone. Generous on purpose: rejecting deeper skin tones would be a
 * fairness bug in a health product, so the band admits every human tone and
 * the darkness test below does the discriminating. Kept in sync with
 * computeSkinFraction in workers/ai-grade-gate. */
export function isSkinLike(r: number, g: number, b: number): boolean {
  const [h, s, v] = rgbToHsv(r, g, b);
  if (v < MIN_VALUE || v > MAX_VALUE) return false;
  return isSkinColour(h, s, r, b);
}

/** The colour half of isSkinLike, for callers that already have the HSV. */
function isSkinColour(h: number, s: number, r: number, b: number): boolean {
  if (s < SKIN_MIN_SATURATION || s > SKIN_MAX_SATURATION) return false;
  if (r - b < SKIN_MIN_RB_GAP) return false;
  return h <= SKIN_HUE_MAX || h >= SKIN_HUE_MIN;
}

// ── CIELAB ──────────────────────────────────────────────────────────────────

const linearise = (c: number) => {
  const n = c / 255;
  return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
};
const labF = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);

/** sRGB (0–255) → CIELAB [L* 0–100, a*, b*] under D65. */
export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const R = linearise(r);
  const G = linearise(g);
  const B = linearise(b);
  const fx = labF((R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047);
  const fy = labF(R * 0.2126 + G * 0.7152 + B * 0.0722);
  const fz = labF((R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** Percentile of a PRE-SORTED ascending array, 0 ≤ p ≤ 1. */
export function percentileOf(sorted: ArrayLike<number>, p: number): number {
  if (sorted.length === 0) return 0;
  const i = clamp(Math.round(p * (sorted.length - 1)), 0, sorted.length - 1);
  return sorted[i];
}

/** Extract features from raw RGBA pixel data (pure — Node-testable). */
export function computePhotoFeatures(
  data: Uint8ClampedArray,
  width: number,
  height: number
): PhotoFeatures {
  const x0 = Math.floor(width * CROP);
  const x1 = Math.max(x0 + 1, Math.ceil(width * (1 - CROP)));
  const y0 = Math.floor(height * CROP);
  const y1 = Math.max(y0 + 1, Math.ceil(height * (1 - CROP)));
  const region = (x1 - x0) * (y1 - y0);
  const stride = Math.max(1, Math.round(Math.sqrt(region / SAMPLE_TARGET)));
  const gw = Math.ceil((x1 - x0) / stride);
  const gh = Math.ceil((y1 - y0) / stride);

  // Pass 1 — sample onto a regular grid, classify, and stash what pass 2 and
  // the texture measurement need. Grid layout (rather than a flat list) is
  // what makes the neighbour lookups in the texture pass possible.
  const n = gw * gh;
  const ery = new Float32Array(n);
  const aStar = new Float32Array(n);
  const lum = new Float32Array(n);
  const candidate = new Uint8Array(n);

  let sampled = 0;
  let dark = 0;
  let blown = 0;
  let usable = 0;
  let skin = 0;

  for (let gy = 0; gy < gh; gy++) {
    const y = y0 + gy * stride;
    if (y >= y1) break;
    for (let gx = 0; gx < gw; gx++) {
      const x = x0 + gx * stride;
      if (x >= x1) break;
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      sampled++;

      const [h, s, v] = rgbToHsv(r, g, b);
      if (v < MIN_VALUE) {
        dark++;
        continue;
      }
      if (v > MAX_VALUE) {
        blown++;
        continue;
      }
      usable++;
      if (!isSkinColour(h, s, r, b)) continue;
      skin++;

      const [L, a] = rgbToLab(r, g, b);
      const k = gy * gw + gx;
      candidate[k] = 1;
      ery[k] = erythemaRatio(r, g);
      aStar[k] = a;
      lum[k] = L;
    }
  }

  const empty = (flags: PhotoQualityFlag[]): PhotoFeatures => ({
    inflamedFraction: 0,
    rednessIndex: 0,
    erythemaContrast: 0,
    textureIndex: 0,
    composite: 0,
    usableFraction: sampled > 0 ? usable / sampled : 0,
    skinFraction: usable > 0 ? skin / usable : 0,
    measuredFraction: 0,
    measuredPixels: 0,
    skinLightness: 0,
    confidence: "low",
    qualityFlags: flags,
  });

  if (skin === 0) return empty(qualityFlagsFor(sampled, dark, blown, usable, 0, 0, 0));

  // Pass 2 — drop hair and cast shadow. Both tests are relative to the median
  // lightness of the candidates, so this discriminates by "much darker than
  // the surrounding skin", not by "dark", and works the same on every tone.
  const candidateLum: number[] = [];
  for (let k = 0; k < n; k++) if (candidate[k]) candidateLum.push(lum[k]);
  candidateLum.sort((p, q) => p - q);
  const medianL = percentileOf(candidateLum, 0.5);
  const hairFloor = medianL * HAIR_LIGHTNESS_RATIO;
  const darkKeepFloor = medianL * DARK_KEEP_LIGHTNESS_RATIO;

  const measured = new Uint8Array(n);
  const eryValues: number[] = [];
  const aValues: number[] = [];
  const lumValues: number[] = [];
  for (let k = 0; k < n; k++) {
    if (!candidate[k]) continue;
    if (lum[k] < hairFloor) {
      // Frankly red pixels survive: a dark crust or a bruise-coloured plaque
      // is the measurement, not a thing to throw away.
      if (!(ery[k] >= DARK_KEEP_ERYTHEMA && lum[k] >= darkKeepFloor)) continue;
    }
    measured[k] = 1;
    eryValues.push(ery[k]);
    aValues.push(aStar[k]);
    lumValues.push(lum[k]);
  }

  const measuredPixels = eryValues.length;
  if (measuredPixels === 0) {
    return empty(qualityFlagsFor(sampled, dark, blown, usable, skin, 0, 0));
  }

  const eSorted = Float64Array.from(eryValues).sort();
  const aSorted = Float64Array.from(aValues).sort();
  const lSorted = Float64Array.from(lumValues).sort();

  const quiet = percentileOf(eSorted, 0.2);
  const peak = percentileOf(eSorted, 0.85);
  const erythemaContrast = Math.max(0, peak - quiet);
  const aContrast = Math.max(0, percentileOf(aSorted, 0.85) - percentileOf(aSorted, 0.2));
  const skinLightness = percentileOf(lSorted, 0.5);

  // Involvement: share of measured skin above this member's own quiet level
  // (or the absolute bar, whichever is easier to clear), on a soft ramp.
  const involvedFloor = Math.min(quiet + INVOLVED_MARGIN, INVOLVED_ABSOLUTE);
  let involved = 0;
  // Lightness of the UNINVOLVED skin only, for the uneven-light check below.
  // Measuring it over everything would flag a dark plaque as bad lighting.
  const quietLum: number[] = [];
  for (let i = 0; i < measuredPixels; i++) {
    const w = ramp(eryValues[i], involvedFloor, involvedFloor + INVOLVED_RAMP);
    involved += w;
    if (w === 0) quietLum.push(lumValues[i]);
  }
  const inflamedFraction = involved / measuredPixels;

  const textureIndex = computeTexture(lum, measured, gw, gh);

  const intensity = Math.max(
    ramp(erythemaContrast, CONTRAST_LO, CONTRAST_HI),
    ramp(peak, ABSOLUTE_LO, ABSOLUTE_HI),
    A_CONTRAST_WEIGHT * ramp(aContrast, A_CONTRAST_LO, A_CONTRAST_HI)
  );

  const severity = clamp(
    intensity +
      TEXTURE_BONUS_MAX * ramp(textureIndex, TEXTURE_LO, TEXTURE_HI) * Math.min(1, intensity / TEXTURE_GATE),
    0,
    1
  );
  const extent = EXTENT_FLOOR + (1 - EXTENT_FLOOR) * inflamedFraction ** EXTENT_CURVE;
  const composite = clamp(severity ** INTENSITY_CURVE * extent, 0, 1);

  const measuredFraction = usable > 0 ? measuredPixels / usable : 0;
  // Needs enough quiet skin for the spread to mean anything; a frame that is
  // almost entirely flare has nothing to judge the lighting by.
  let spread = 0;
  if (quietLum.length >= Math.max(100, measuredPixels * 0.1)) {
    quietLum.sort((p, q) => p - q);
    spread = percentileOf(quietLum, 0.9) - percentileOf(quietLum, 0.1);
  }
  const flags = qualityFlagsFor(sampled, dark, blown, usable, skin, measuredPixels, spread, skinLightness);

  return {
    inflamedFraction,
    rednessIndex: peak,
    erythemaContrast,
    textureIndex,
    composite,
    usableFraction: sampled > 0 ? usable / sampled : 0,
    skinFraction: usable > 0 ? skin / usable : 0,
    measuredFraction,
    measuredPixels,
    skinLightness,
    confidence: confidenceFor(flags, measuredPixels),
    qualityFlags: flags,
  };
}

/**
 * Mean local luminance gradient inside the skin mask, normalised by local
 * brightness so it doesn't just track exposure.
 *
 * Only interior points are measured — every one of the four neighbours must
 * also be measured skin — so the hard edge where skin meets background, hair
 * or clothing contributes nothing. That edge is a huge gradient and would
 * otherwise make "small patch on a dark towel" look maximally scaly.
 */
export function computeTexture(
  lum: Float32Array,
  mask: Uint8Array,
  gw: number,
  gh: number
): number {
  let sum = 0;
  let count = 0;
  for (let y = 1; y < gh - 1; y++) {
    for (let x = 1; x < gw - 1; x++) {
      const k = y * gw + x;
      if (!mask[k]) continue;
      const left = k - 1;
      const right = k + 1;
      const up = k - gw;
      const down = k + gw;
      if (!mask[left] || !mask[right] || !mask[up] || !mask[down]) continue;
      const dx = Math.abs(lum[right] - lum[left]);
      const dy = Math.abs(lum[down] - lum[up]);
      // Halved because each difference spans two samples.
      sum += (dx + dy) / 4 / Math.max(8, lum[k]);
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

function qualityFlagsFor(
  sampled: number,
  dark: number,
  blown: number,
  usable: number,
  skin: number,
  measuredPixels: number,
  lightnessSpread: number,
  skinLightness = 0
): PhotoQualityFlag[] {
  const flags: PhotoQualityFlag[] = [];
  if (sampled > 0 && dark / sampled > 0.35) flags.push("low-light");
  if (sampled > 0 && blown / sampled > 0.2) flags.push("blown-highlights");
  if (lightnessSpread > 45) flags.push("uneven-light");
  // A lot of the skin-coloured area was hair or cast shadow. The two causes
  // aren't separable from colour alone and the consequence is the same either
  // way, so they share one honest flag.
  if (skin > 0 && measuredPixels / skin < 0.8) flags.push("partly-unreadable");
  if (usable > 0 && skin / usable < 0.45) flags.push("small-patch");
  else if (measuredPixels > 0 && measuredPixels < 2_000) flags.push("small-patch");
  if (skinLightness > 0 && skinLightness < 40) flags.push("deep-tone");
  return flags;
}

function confidenceFor(flags: PhotoQualityFlag[], measuredPixels: number): PhotoConfidence {
  if (measuredPixels < 1_000 || flags.length >= 2) return "low";
  if (flags.length === 1) return "moderate";
  return "good";
}

/** Plain-English reason for each quality flag, for the estimate detail panel.
 * Worded as "what this photo can support", never as a judgement of the member
 * or their skin. */
export const QUALITY_FLAG_COPY: Record<PhotoQualityFlag, string> = {
  "low-light": "Much of the frame is in shadow — colour readings get unreliable in low light.",
  "blown-highlights": "Parts of the frame are blown out by flash or direct sun, so their colour is lost.",
  "uneven-light": "The light across the patch is very uneven, which exaggerates some areas and hides others.",
  "partly-unreadable":
    "A good part of the frame was hair or deep shadow and couldn't be measured, so this is based on what was left.",
  "small-patch": "The patch fills only a small part of the frame. Get closer so it fills more of it.",
  "deep-tone":
    "On deeper skin tones inflammation shows as violet or grey-brown rather than red, and a colour estimate reads it much less reliably.",
};

/** Whether a photo looks enough like skin to be worth grading or storing as a
 * flare photo. Cheap gate that runs before any model does — see
 * MIN_SKIN_FRACTION in lib/ai-grading.ts for the threshold rationale. */
export function isLikelySkinPhoto(features: PhotoFeatures, minSkinFraction: number): boolean {
  return features.skinFraction >= minSkinFraction;
}

/** Why the photo can't be graded, or null when it's fine. */
export function rejectPhoto(features: PhotoFeatures): PhotoRejection | null {
  if (features.usableFraction < MIN_USABLE_FRACTION) return "too-dark";
  if (features.skinFraction < MIN_SKIN_FRACTION) return "too-little-skin";
  // Skin was found, but almost all of it was hair or deep shadow. Nothing
  // survives to measure, and inventing a number from the remainder would be
  // the v2 mistake in a new costume.
  if (features.measuredPixels < MIN_MEASURED_PIXELS) return "too-dark";
  return null;
}

/** 0–100 estimate.
 *
 * With a trusted baseline (see pickBaseline — the member's own photo from a day
 * they rated calm) the score is relative: the baseline lands on
 * BASELINE_ANCHOR and the remaining headroom is stretched over what's left of
 * the composite range. Normalising by headroom means a member whose calm skin
 * already reads warm still gets the full 0–100 range for their flares, and it
 * keeps the relative and absolute scales roughly agreeing, so earning a
 * baseline doesn't lurch the number.
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
    const rel =
      BASELINE_ANCHOR +
      (100 - BASELINE_ANCHOR) * ((features.composite - baseline.composite) / headroom);
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
  // Downscale before sampling. 640 rather than v2's 512: the texture pass
  // needs real neighbouring detail, and anything finer than this is mostly
  // sensor noise and JPEG blocking anyway.
  const maxDim = 640;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return computePhotoFeatures(data, canvas.width, canvas.height);
}
