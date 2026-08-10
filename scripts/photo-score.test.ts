// Unit tests for the Tier A photo severity heuristic (src/lib/photo-score.ts)
// and the Tier B label parsing (src/lib/photo-model.ts).
// Run with: npm run test:photo-score
import assert from "node:assert/strict";
import {
  CALM_MANUAL_SEVERITY,
  type PhotoFeatures,
  PHOTO_SCORE_VERSION,
  REGION_GRID,
  computePhotoFeatures,
  easiAreaBand,
  erythemaRatio,
  estimateAgreement,
  estimateInterval,
  flareBand,
  isSkinLike,
  percentileOf,
  pickBaseline,
  rejectPhoto,
  rgbToHsv,
  rgbToLab,
  scorePhoto,
  signReadout,
} from "../src/lib/photo-score";
import { labelMidpoint } from "../src/lib/photo-model";

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    throw err;
  }
}

type RGB = [number, number, number];

/** Build a WxH RGBA buffer filled with one colour. */
function solid(w: number, h: number, rgb: RGB): Uint8ClampedArray {
  return mix(w, h, [[rgb, 1]]);
}

/** Build a WxH RGBA buffer from colour/share pairs, laid out in horizontal
 * bands. Shares are normalised, so `mix(w, h, [[SKIN, 1], [TOWEL, 1]])` is a
 * half-and-half frame. */
function mix(w: number, h: number, parts: [RGB, number][]): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4);
  const total = parts.reduce((s, p) => s + p[1], 0);
  let y = 0;
  parts.forEach(([rgb, share], idx) => {
    const rows = idx === parts.length - 1 ? h - y : Math.round((share / total) * h);
    for (let row = y; row < y + rows && row < h; row++) {
      for (let x = 0; x < w; x++) {
        const i = (row * w + x) * 4;
        data[i] = rgb[0];
        data[i + 1] = rgb[1];
        data[i + 2] = rgb[2];
        data[i + 3] = 255;
      }
    }
    y += rows;
  });
  return data;
}

/** Multiply every pixel's brightness by a deterministic pseudo-random factor
 * in 1±amp. Because the erythema ratio (R−G)/(R+G) is scale-invariant, this
 * changes ONLY the texture index — colour statistics come out identical. */
function roughen(data: Uint8ClampedArray, amp: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data);
  let seed = 12345;
  for (let i = 0; i < out.length; i += 4) {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    const f = 1 + amp * ((seed / 0xffffffff) * 2 - 1);
    out[i] = Math.min(255, Math.round(out[i] * f));
    out[i + 1] = Math.min(255, Math.round(out[i + 1] * f));
    out[i + 2] = Math.min(255, Math.round(out[i + 2] * f));
  }
  return out;
}

const CALM_PALE: RGB = [224, 188, 160];
const CALM_MID: RGB = [180, 140, 120];
const CALM_DEEP: RGB = [110, 80, 65];
const INFLAMED: RGB = [200, 70, 60];
const GREY_TOWEL: RGB = [92, 92, 96]; // the backdrop in the reported photo
const DARK_HAIR: RGB = [60, 45, 40];
const BLACK: RGB = [4, 4, 4];

const featuresOf = (rgb: RGB) => computePhotoFeatures(solid(120, 120, rgb), 120, 120);
const scoreOf = (rgb: RGB) => {
  const g = scorePhoto(featuresOf(rgb), null);
  assert.ok(g.ok, "expected a gradable photo");
  return g.score;
};
const absoluteScore = (features: PhotoFeatures) => {
  const g = scorePhoto(features, null);
  assert.ok(g.ok, "expected a gradable photo");
  return g.score;
};

/** A synthetic feature set for the pure scoring/baseline tests. */
function featuresLike(patch: Partial<PhotoFeatures>): PhotoFeatures {
  return {
    inflamedFraction: 0,
    rednessIndex: 0,
    erythemaContrast: 0,
    textureIndex: 0,
    composite: 0,
    usableFraction: 1,
    skinFraction: 1,
    measuredFraction: 1,
    measuredPixels: 8_000,
    skinLightness: 60,
    intensity: 0,
    confidence: "good",
    qualityFlags: [],
    regionMap: new Array(REGION_GRID * REGION_GRID).fill(null),
    worstRegion: null,
    regionSpread: 0,
    boundaryAmbiguity: 0,
    ...patch,
  };
}

test("rgbToHsv: known colours", () => {
  assert.deepEqual(rgbToHsv(255, 0, 0), [0, 1, 1]); // pure red
  const [h, s, v] = rgbToHsv(0, 255, 0);
  assert.equal(h, 120);
  assert.equal(s, 1);
  assert.equal(v, 1);
  assert.deepEqual(rgbToHsv(0, 0, 0), [0, 0, 0]);
});

test("rgbToLab: reference values, and a* rises with redness", () => {
  const [wl, wa, wb] = rgbToLab(255, 255, 255);
  assert.ok(Math.abs(wl - 100) < 0.5 && Math.abs(wa) < 0.5 && Math.abs(wb) < 0.5);
  assert.equal(Math.round(rgbToLab(0, 0, 0)[0]), 0);
  const [, redA] = rgbToLab(255, 0, 0);
  assert.ok(redA > 70, `pure red should sit far up a*, got ${redA}`);
  // Lightness tracks the eye, not the raw channel average.
  assert.ok(rgbToLab(...CALM_PALE)[0] > rgbToLab(...CALM_DEEP)[0]);
  assert.ok(rgbToLab(...INFLAMED)[1] > rgbToLab(...CALM_PALE)[1]);
});

test("percentileOf: clamps, interpolates by index, handles empties", () => {
  const xs = [1, 2, 3, 4, 5];
  assert.equal(percentileOf(xs, 0), 1);
  assert.equal(percentileOf(xs, 1), 5);
  assert.equal(percentileOf(xs, 0.5), 3);
  assert.equal(percentileOf([], 0.5), 0);
  assert.equal(percentileOf([7], 0.85), 7);
});

test("erythemaRatio: separates flare from skin, never negative", () => {
  assert.ok(erythemaRatio(200, 70) > 0.4);
  assert.ok(erythemaRatio(224, 188) < 0.1);
  assert.equal(erythemaRatio(60, 200), 0); // clamped, not negative
  assert.equal(erythemaRatio(0, 0), 0);
});

test("isSkinLike: every tone in, backgrounds out", () => {
  for (const rgb of [CALM_PALE, CALM_MID, CALM_DEEP, INFLAMED] as RGB[]) {
    assert.ok(isSkinLike(...rgb), `${rgb} should read as skin`);
  }
  assert.ok(!isSkinLike(...GREY_TOWEL), "a grey towel is not skin");
  assert.ok(!isSkinLike(60, 90, 140), "denim is not skin");
  assert.ok(!isSkinLike(...BLACK), "deep shadow is not skin");
  assert.ok(!isSkinLike(250, 250, 250), "a white wall is not skin");
  assert.ok(!isSkinLike(220, 20, 20), "a saturated red jumper is not skin");
});

test("features: inflamed red scores far above calm skin", () => {
  const calm = featuresOf(CALM_PALE);
  const inflamed = featuresOf(INFLAMED);
  assert.ok(inflamed.composite > calm.composite + 0.3, "red must dominate the composite");
  assert.ok(inflamed.inflamedFraction > 0.9);
  assert.ok(calm.inflamedFraction < 0.2);
});

// The v1 heuristic scored normal mid- and deep-toned skin at 85–95/100 on the
// absolute scale — indistinguishable from a real flare. That's what made the
// absolute fallback unusable, which in turn made a bad baseline so damaging.
test("absolute scale: calm skin of every tone stays well below a flare", () => {
  const flare = scoreOf(INFLAMED);
  for (const [name, rgb] of [
    ["pale", CALM_PALE],
    ["mid", CALM_MID],
    ["deep", CALM_DEEP],
  ] as [string, RGB][]) {
    const calm = scoreOf(rgb);
    assert.ok(calm < 45, `calm ${name} skin scored ${calm} — must stay below 45`);
    assert.ok(flare > calm + 35, `flare (${flare}) must clear calm ${name} (${calm}) by 35+`);
  }
  assert.ok(flare > 80, `frank erythema should read high, got ${flare}`);
});

test("skin masking: a grey backdrop doesn't dilute the reading", () => {
  const onlySkin = computePhotoFeatures(solid(120, 120, INFLAMED), 120, 120);
  // Same inflamed skin, but now half the frame is the towel it's resting on.
  const withTowel = computePhotoFeatures(
    mix(120, 120, [[INFLAMED, 1], [GREY_TOWEL, 1]]),
    120,
    120
  );
  assert.ok(withTowel.skinFraction < 0.7, "towel must be excluded from the skin mask");
  assert.ok(
    Math.abs(withTowel.composite - onlySkin.composite) < 0.05,
    `backdrop shifted the composite from ${onlySkin.composite} to ${withTowel.composite}`
  );
  const graded = scorePhoto(withTowel, null);
  assert.ok(graded.ok && graded.score > 80, "an inflamed patch on a towel is still a flare");
});

// v3 headline fix #1: the flare is a PATCH. Averaging it with the calm skin
// around it is a worse measurement the more of the person is in shot.
test("percentile stats: a raw patch on mostly-calm skin is not 'calm'", () => {
  // 80% ordinary pale skin, 20% raw. The v2 mean put this at ~20/100.
  const frame = mix(200, 200, [[CALM_PALE, 4], [INFLAMED, 1]]);
  const features = computePhotoFeatures(frame, 200, 200);
  assert.ok(
    features.erythemaContrast > 0.3,
    `the patch must stand out from their own skin, got ${features.erythemaContrast}`
  );
  assert.ok(
    Math.abs(features.inflamedFraction - 0.2) < 0.05,
    `about a fifth of the skin is involved, got ${features.inflamedFraction}`
  );
  const score = absoluteScore(features);
  assert.ok(score >= 55, `a raw fifth of the frame must not read calm, got ${score}`);
  assert.notEqual(flareBand(score).label, "Calm");
  // …and it stays below a frame that is raw all over.
  assert.ok(score < scoreOf(INFLAMED), "extent must still move the number");
});

// v3 headline fix #2: dark hair is a warm, R > G > B colour and sailed through
// the v2 skin gate, dragging the mean down on every photo of a face or a beard.
// This is the reported "Calm 12/100" on a badly crusted face.
test("hair rejection: a face full of hair doesn't dilute the flare", () => {
  const frame = mix(200, 200, [[DARK_HAIR, 2], [CALM_PALE, 2], [INFLAMED, 1]]);
  const features = computePhotoFeatures(frame, 200, 200);

  // Hair is a skin-COLOURED candidate (skinFraction sees it, so the abuse gate
  // is unchanged) but must not survive into the measurement.
  assert.ok(features.skinFraction > 0.9, "the colour gate still admits hair");
  assert.ok(
    Math.abs(features.measuredFraction - 0.6) < 0.06,
    `hair should be ~40% of the frame and dropped, measured ${features.measuredFraction}`
  );

  const score = absoluteScore(features);
  assert.ok(score > 55, `an inflamed patch beside hair must read as a flare, got ${score}`);
  assert.ok(["Moderate", "Marked"].includes(flareBand(score).label));
});

test("hair rejection: a dark red crust survives the darkness test", () => {
  // Deep bruise-coloured plaque against ordinary skin — dark, but frankly red.
  const CRUST: RGB = [130, 58, 48];
  const frame = mix(200, 200, [[CALM_PALE, 3], [CRUST, 2]]);
  const features = computePhotoFeatures(frame, 200, 200);
  assert.ok(
    features.measuredFraction > 0.9,
    `the crust must not be mistaken for hair, measured ${features.measuredFraction}`
  );
  assert.ok(absoluteScore(features) > 50, "a dark plaque is still a plaque");
});

test("deep skin tones are not treated as hair", () => {
  const features = featuresOf(CALM_DEEP);
  assert.ok(
    features.measuredFraction > 0.95,
    `deep skin must survive the darkness test, measured ${features.measuredFraction}`
  );
  assert.ok(features.qualityFlags.includes("deep-tone"), "…but the caveat is surfaced");
  assert.notEqual(features.confidence, "good");
});

// v3 headline fix #3: crust, scale and excoriation are what make a flare look
// severe, and none of them are red.
test("texture: broken skin reads above the same colour, smooth", () => {
  const MODERATE: RGB = [200, 105, 92];
  const flat = computePhotoFeatures(solid(200, 200, MODERATE), 200, 200);
  const rough = computePhotoFeatures(roughen(solid(200, 200, MODERATE), 0.2), 200, 200);

  assert.ok(flat.textureIndex < 0.01, `smooth skin should be flat, got ${flat.textureIndex}`);
  assert.ok(rough.textureIndex > 0.02, `broken skin should be rough, got ${rough.textureIndex}`);
  // Colour statistics are untouched — the ratio is scale-invariant — so the
  // whole difference below is texture.
  assert.ok(Math.abs(rough.rednessIndex - flat.rednessIndex) < 0.02);

  const flatScore = absoluteScore(flat);
  const roughScore = absoluteScore(rough);
  assert.ok(roughScore > flatScore, `${roughScore} should beat ${flatScore}`);
  assert.ok(roughScore - flatScore <= 25, "texture is a bonus, never the driver");
});

test("texture: can't invent a flare out of calm skin", () => {
  const rough = computePhotoFeatures(roughen(solid(200, 200, CALM_PALE), 0.25), 200, 200);
  assert.ok(rough.textureIndex > 0.02, "the frame really is textured");
  const score = absoluteScore(rough);
  assert.ok(score < 20, `textured but calm skin must stay calm, got ${score}`);
});

test("rejects: too dark, and frames that are mostly background", () => {
  const dark = featuresOf(BLACK);
  assert.ok(dark.usableFraction < 0.2);
  assert.equal(rejectPhoto(dark), "too-dark");
  assert.deepEqual(scorePhoto(dark, null), { ok: false, reason: "too-dark" });

  // Mostly towel, a sliver of skin — grading this would grade the bedding.
  const mostlyTowel = computePhotoFeatures(
    mix(120, 120, [[GREY_TOWEL, 9], [INFLAMED, 1]]),
    120,
    120
  );
  assert.equal(rejectPhoto(mostlyTowel), "too-little-skin");
  assert.deepEqual(scorePhoto(mostlyTowel, null), { ok: false, reason: "too-little-skin" });

  // Skin-coloured, but it was all hair: nothing survives to measure.
  assert.equal(rejectPhoto(featuresLike({ measuredPixels: 20 })), "too-dark");

  assert.equal(rejectPhoto(featuresOf(CALM_PALE)), null);
});

test("confidence: clean frames are trusted, compromised ones say so", () => {
  const clean = featuresOf(CALM_PALE);
  assert.equal(clean.confidence, "good");
  assert.deepEqual(clean.qualityFlags, []);

  // Half the frame is towel — the patch isn't filling it.
  const small = computePhotoFeatures(
    mix(200, 200, [[GREY_TOWEL, 7], [INFLAMED, 3]]),
    200,
    200
  );
  assert.ok(small.qualityFlags.includes("small-patch"));
  assert.notEqual(small.confidence, "good");

  // Deep shadow over most of the frame.
  const dim = computePhotoFeatures(mix(200, 200, [[BLACK, 1], [CALM_PALE, 1]]), 200, 200);
  assert.ok(dim.qualityFlags.includes("low-light"));

  // Same skin, lit from bright to dim across the frame.
  const uneven = computePhotoFeatures(
    mix(200, 200, [
      [[240, 205, 178], 1],
      [CALM_PALE, 1],
      [[150, 124, 105], 1],
      [[105, 86, 73], 1],
    ]),
    200,
    200
  );
  assert.ok(uneven.qualityFlags.includes("partly-unreadable"));
  assert.equal(uneven.confidence, "moderate");
});

// Evenness is judged on the UNINVOLVED skin: a dark plaque makes a frame very
// uneven in lightness, and that's the flare, not the lighting.
test("confidence: a dark plaque isn't mistaken for bad lighting", () => {
  const features = computePhotoFeatures(
    mix(200, 200, [[CALM_PALE, 3], [[130, 58, 48], 2]]),
    200,
    200
  );
  assert.ok(!features.qualityFlags.includes("uneven-light"), features.qualityFlags.join(","));
});

// ─── Region map ──────────────────────────────────────────────────────────────

test("region map: points at the patch instead of restating the whole frame", () => {
  // Raw band across the bottom fifth, calm skin above it.
  const features = computePhotoFeatures(
    mix(250, 250, [[CALM_PALE, 4], [INFLAMED, 1]]),
    250,
    250
  );
  assert.equal(features.regionMap.length, REGION_GRID * REGION_GRID);
  assert.ok(features.regionMap.every((c) => c === null || (c >= 0 && c <= 1)));

  const worst = features.worstRegion!;
  assert.ok(worst, "a tile should stand out");
  assert.equal(worst.row, REGION_GRID - 1, "the flare is along the bottom");

  // Top row is calm skin, bottom row is raw — the map must separate them.
  const top = features.regionMap[0]!;
  assert.ok(top < 0.2, `top tile should read calm, got ${top}`);
  assert.ok(worst.composite > 0.75, `bottom tile should read raw, got ${worst.composite}`);
  assert.ok(features.regionSpread > 0.3, "the frame genuinely disagrees with itself");
});

// The whole point of scoring tiles against the GLOBAL quiet reference: a tile
// made entirely of flare has no calm skin in it, and referencing it to itself
// would recreate the original "Calm 12/100" bug one level down.
test("region map: a tile that is all flare doesn't score itself as calm", () => {
  const features = computePhotoFeatures(
    mix(250, 250, [[CALM_PALE, 4], [INFLAMED, 1]]),
    250,
    250
  );
  const bottomRow = features.regionMap.slice(-REGION_GRID);
  for (const tile of bottomRow) {
    assert.ok(tile != null && tile > 0.75, `an all-flare tile read ${tile}`);
  }
});

test("region map: a uniform frame agrees with itself", () => {
  const features = featuresOf(INFLAMED);
  assert.ok(features.regionSpread < 0.05, `uniform frame spread ${features.regionSpread}`);
  assert.ok(features.regionMap.every((c) => c != null && c > 0.9));
});

// ─── Honest range ────────────────────────────────────────────────────────────

test("estimateInterval: tight when the frame agrees, wide when it doesn't", () => {
  const clean = estimateInterval(50, { regionSpread: 0, boundaryAmbiguity: 0, qualityFlags: [] });
  assert.deepEqual(clean, { low: 46, high: 54 });

  const messy = estimateInterval(50, {
    regionSpread: 0.4,
    boundaryAmbiguity: 0.5,
    qualityFlags: ["low-light", "deep-tone"],
  });
  assert.ok(messy.high - messy.low > clean.high - clean.low, "caveats must widen it");
  assert.ok(messy.high - messy.low <= 50, "…but not unboundedly");

  // Never runs off the ends of the scale.
  const top = estimateInterval(98, { regionSpread: 1, boundaryAmbiguity: 1, qualityFlags: [] });
  assert.equal(top.high, 100);
  assert.equal(estimateInterval(2, { regionSpread: 1, boundaryAmbiguity: 1, qualityFlags: [] }).low, 0);
});

// ─── Structured read-out ─────────────────────────────────────────────────────

test("easiAreaBand: matches the EASI categories", () => {
  assert.equal(easiAreaBand(0), 0);
  assert.equal(easiAreaBand(1), 1);
  assert.equal(easiAreaBand(9), 1);
  assert.equal(easiAreaBand(10), 2);
  assert.equal(easiAreaBand(29), 2);
  assert.equal(easiAreaBand(30), 3);
  assert.equal(easiAreaBand(50), 4);
  assert.equal(easiAreaBand(70), 5);
  assert.equal(easiAreaBand(90), 6);
  assert.equal(easiAreaBand(100), 6);
});

test("signReadout: breaks the number into what a clinician asks about", () => {
  const calm = signReadout(featuresOf(CALM_PALE));
  assert.equal(calm.erythema, 0);
  assert.equal(calm.surfaceDamage, 0);
  assert.equal(calm.areaBand, 0);

  const raw = signReadout(featuresOf(INFLAMED));
  assert.equal(raw.erythema, 3);
  assert.equal(raw.areaPercentOfPhoto, 100);
  assert.equal(raw.areaBand, 6);

  // Broken skin lifts the surface sign without touching redness.
  const MODERATE: RGB = [200, 105, 92];
  const flat = signReadout(computePhotoFeatures(solid(200, 200, MODERATE), 200, 200));
  const rough = signReadout(
    computePhotoFeatures(roughen(solid(200, 200, MODERATE), 0.2), 200, 200)
  );
  assert.equal(flat.surfaceDamage, 0);
  assert.ok(rough.surfaceDamage >= 2, `broken skin should register, got ${rough.surfaceDamage}`);
  assert.equal(rough.erythema, flat.erythema, "texture must not move the redness sign");

  // The two signs a photograph cannot show are named, never guessed.
  assert.deepEqual([...raw.notMeasurable], ["edema", "lichenification"]);
});

test("signReadout: every value lands in the EASI ranges", () => {
  for (const rgb of [CALM_PALE, CALM_MID, CALM_DEEP, INFLAMED, [210, 110, 95]] as RGB[]) {
    const r = signReadout(featuresOf(rgb));
    assert.ok(r.erythema >= 0 && r.erythema <= 3, `erythema ${r.erythema}`);
    assert.ok(r.surfaceDamage >= 0 && r.surfaceDamage <= 3, `surface ${r.surfaceDamage}`);
    assert.ok(r.areaBand >= 0 && r.areaBand <= 6, `area ${r.areaBand}`);
    assert.ok(r.areaPercentOfPhoto >= 0 && r.areaPercentOfPhoto <= 100);
  }
});

test("scorePhoto: baseline-relative anchors the calm photo near 12", () => {
  const calm = featuresOf(CALM_PALE);
  const inflamed = featuresOf(INFLAMED);
  const self = scorePhoto(calm, { composite: calm.composite });
  assert.ok(self.ok && self.score === 12 && self.basis === "baseline");
  const rel = scorePhoto(inflamed, { composite: calm.composite });
  assert.ok(rel.ok && rel.score > 50, `relative inflamed score should be high, got ${rel}`);
});

// Headroom normalisation: someone whose calm skin already reads warm still
// gets the full range for their flares, instead of every flare bunching up.
test("scorePhoto: a high baseline still leaves room to register a flare", () => {
  const deepCalm = featuresOf(CALM_DEEP);
  const flare = featuresOf(INFLAMED);
  const own = scorePhoto(deepCalm, { composite: deepCalm.composite });
  assert.ok(own.ok && own.score === 12);
  const rel = scorePhoto(flare, { composite: deepCalm.composite });
  assert.ok(rel.ok && rel.score > 65, `flare over a warm baseline should read high, got ${rel}`);
});

// The reported bug: an obviously raw arm came back "Calm 0/100" because the
// only saved photos were flares, so the "calmest" one was itself a flare.
test("pickBaseline: a flare is never the baseline just because it was saved first", () => {
  const flaresOnly = [
    { composite: 0.88, area: "arms", takenAt: "2026-07-01", version: PHOTO_SCORE_VERSION },
    { composite: 0.83, area: "arms", takenAt: "2026-07-04", version: PHOTO_SCORE_VERSION },
  ];
  // Both days were rated 8/10 — the member says these are flares.
  const severities = { "2026-07-01": 8, "2026-07-04": 8 };
  assert.equal(pickBaseline(flaresOnly, "arms", severities), null);

  // …so the next flare is scored absolutely, and reads as a flare.
  const today = featuresLike({ composite: 0.739, inflamedFraction: 0.6, rednessIndex: 0.3 });
  const graded = scorePhoto(today, pickBaseline(flaresOnly, "arms", severities));
  assert.ok(graded.ok);
  assert.equal(graded.basis, "absolute");
  assert.equal(graded.score, 74);
  assert.equal(flareBand(graded.score).label, "Marked");

  // The v1 behaviour, for contrast: least-red-photo-wins scored this 0/100.
  const worst = flaresOnly.reduce((m, p) => (p.composite < m.composite ? p : m));
  const naive = scorePhoto(today, worst);
  assert.ok(naive.ok && naive.score < 20, "v1 really did call this Calm");
});

test("pickBaseline: only calm-day, current-version photos are eligible", () => {
  const photos = [
    { composite: 0.4, area: "face", takenAt: "2026-07-01", version: PHOTO_SCORE_VERSION },
    { composite: 0.1, area: "arms", takenAt: "2026-07-02", version: PHOTO_SCORE_VERSION },
    { composite: 0.2, area: "face", takenAt: "2026-07-03", version: PHOTO_SCORE_VERSION },
    { composite: 0.05, area: "face", takenAt: "2026-07-04", version: PHOTO_SCORE_VERSION }, // flare day
    { composite: 0.02, area: "face", takenAt: "2026-07-05", version: PHOTO_SCORE_VERSION }, // unrated
    { composite: 0.01, area: "face", takenAt: "2026-07-06", version: PHOTO_SCORE_VERSION - 1 }, // old version
  ];
  const sev = {
    "2026-07-01": 2,
    "2026-07-02": 3,
    "2026-07-03": CALM_MANUAL_SEVERITY,
    "2026-07-04": 9, // rated a flare → ineligible despite the low composite
    "2026-07-06": 1, // calm, but scored by an incomparable older heuristic
  };
  assert.equal(pickBaseline(photos, "face", sev)!.composite, 0.2); // same area wins
  assert.equal(pickBaseline(photos, "legs", sev)!.composite, 0.1); // no legs photos → global min
  assert.equal(pickBaseline(photos, null, sev)!.composite, 0.1);
  assert.equal(pickBaseline(photos, "face", {}), null); // nothing rated → no baseline
  assert.equal(pickBaseline([], "face", sev), null);
});

// A hard erythema threshold used to put a cliff mid-range: 0.158 read as 0%
// inflamed and 0.200 as 100%, a 60-point swing between neighbouring shades of
// normal deep-toned skin. The ladder must climb smoothly instead.
test("absolute scale: climbs monotonically with redness, no cliffs", () => {
  const ladder: [string, RGB][] = [
    ["calm pale", CALM_PALE],
    ["calm mid", CALM_MID],
    ["calm deep", CALM_DEEP],
    ["very deep", [90, 60, 45]],
    ["mild pink", [230, 150, 140]],
    ["pink", [220, 130, 118]],
    ["moderate", [210, 110, 95]],
    ["angry", [205, 90, 78]],
    ["inflamed", INFLAMED],
  ];
  const scores = ladder.map(([, rgb]) => scoreOf(rgb));
  for (let i = 1; i < scores.length; i++) {
    assert.ok(
      scores[i] >= scores[i - 1],
      `${ladder[i][0]} (${scores[i]}) must not score below ${ladder[i - 1][0]} (${scores[i - 1]})`
    );
    assert.ok(
      scores[i] - scores[i - 1] <= 45,
      `cliff between ${ladder[i - 1][0]} (${scores[i - 1]}) and ${ladder[i][0]} (${scores[i]})`
    );
  }
});

// End-to-end on an approximation of the reported photo: a raw forearm on a
// grey towel, with the paler back of the hand in frame. Graded 0/100 "Calm".
test("regression: the reported photo grades as a flare, baseline or not", () => {
  const frame = mix(200, 200, [
    [GREY_TOWEL, 0.4],
    [[196, 72, 64], 0.4], // raw forearm
    [[214, 150, 132], 0.2], // paler back of the hand
  ]);
  const features = computePhotoFeatures(frame, 200, 200);

  const absolute = scorePhoto(features, null);
  assert.ok(absolute.ok, "the photo is gradable");
  assert.equal(absolute.basis, "absolute");
  assert.equal(flareBand(absolute.score).label, "Marked");

  // With a genuine calm baseline the verdict must not lurch — the two scales
  // are calibrated to agree, so earning a baseline isn't a step change.
  const relative = scorePhoto(features, { composite: 0.18 });
  assert.ok(relative.ok && Math.abs(relative.score - absolute.score) < 15);
  assert.equal(flareBand(relative.score).label, "Marked");
});

// The second reported photo: a crusted face and neck, shot in a car. Lots of
// dark curly hair, a bright window behind, plenty of ordinary facial skin, and
// a large broken red patch. v2 called it "Calm 12/100".
test("regression: the crusted-face photo is not calm", () => {
  const frame = roughen(
    mix(240, 240, [
      [[248, 250, 252], 1.2], // blown-out car window
      [DARK_HAIR, 2.2], // curly hair and beard
      [[222, 176, 152], 2], // unaffected cheek and ear
      [[186, 96, 84], 3], // crusted, broken plaque
      [[150, 66, 58], 1.6], // darker weeping area
    ]),
    0.18
  );
  const features = computePhotoFeatures(frame, 240, 240);

  assert.equal(rejectPhoto(features), null, "this photo is gradable");
  assert.ok(features.measuredFraction < 0.8, "the hair is dropped from the measurement");
  assert.ok(features.erythemaContrast > 0.15, "the plaque stands out from the face");
  assert.ok(features.textureIndex > 0.02, "broken skin registers as broken");

  const score = absoluteScore(features);
  assert.ok(score > 65, `the reported photo must not read calm, got ${score}`);
  assert.equal(flareBand(score).label, "Marked");
});

test("estimateAgreement: needs 5 pairs, detects a tracking heuristic", () => {
  assert.equal(estimateAgreement([[10, 2], [50, 5], [90, 9]]), null);
  const good: [number, number][] = [[10, 2], [25, 3], [40, 5], [60, 6], [85, 8], [95, 9]];
  const a = estimateAgreement(good)!;
  assert.equal(a.n, 6);
  assert.ok(a.r > 0.9);
});

test("flareBand: covers 0–100 and runs worse as the score rises", () => {
  assert.equal(flareBand(0).label, "Calm");
  assert.equal(flareBand(20).label, "Calm");
  assert.equal(flareBand(21).label, "Mild");
  assert.equal(flareBand(40).label, "Mild");
  assert.equal(flareBand(41).label, "Moderate");
  assert.equal(flareBand(65).label, "Moderate");
  assert.equal(flareBand(66).label, "Marked");
  assert.equal(flareBand(100).label, "Marked");
  // Tones must darken with severity — the opposite of the product scores.
  const order = ["emerald", "green", "orange", "rose"];
  let last = -1;
  for (const s of [0, 30, 50, 90]) {
    const i = order.indexOf(flareBand(s).tone);
    assert.ok(i > last, `tone should worsen at ${s}`);
    last = i;
  }
});

test("labelMidpoint: bands, single numbers, and junk labels", () => {
  assert.equal(labelMidpoint("20-40", 0, 5), 30);
  assert.equal(labelMidpoint(" 0 - 20 ", 0, 5), 10);
  assert.equal(labelMidpoint("75", 3, 5), 75);
  assert.equal(labelMidpoint("mild", 0, 3), 0); // junk → even spread over 0–100
  assert.equal(labelMidpoint("moderate", 1, 3), 50);
  assert.equal(labelMidpoint("severe", 2, 3), 100);
});

console.log(`\n${passed} photo-score tests passed.`);
