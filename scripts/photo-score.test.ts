// Unit tests for the Tier A photo severity heuristic (src/lib/photo-score.ts)
// and the Tier B label parsing (src/lib/photo-model.ts).
// Run with: npm run test:photo-score
import assert from "node:assert/strict";
import {
  CALM_MANUAL_SEVERITY,
  PHOTO_SCORE_VERSION,
  computePhotoFeatures,
  erythemaRatio,
  estimateAgreement,
  flareBand,
  pickBaseline,
  rejectPhoto,
  rgbToHsv,
  scorePhoto,
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

const CALM_PALE: RGB = [224, 188, 160];
const CALM_MID: RGB = [180, 140, 120];
const CALM_DEEP: RGB = [110, 80, 65];
const INFLAMED: RGB = [200, 70, 60];
const GREY_TOWEL: RGB = [92, 92, 96]; // the backdrop in the reported photo
const BLACK: RGB = [4, 4, 4];

const featuresOf = (rgb: RGB) => computePhotoFeatures(solid(100, 100, rgb), 100, 100);
const scoreOf = (rgb: RGB) => {
  const g = scorePhoto(featuresOf(rgb), null);
  assert.ok(g.ok, "expected a gradable photo");
  return g.score;
};

test("rgbToHsv: known colours", () => {
  assert.deepEqual(rgbToHsv(255, 0, 0), [0, 1, 1]); // pure red
  const [h, s, v] = rgbToHsv(0, 255, 0);
  assert.equal(h, 120);
  assert.equal(s, 1);
  assert.equal(v, 1);
  assert.deepEqual(rgbToHsv(0, 0, 0), [0, 0, 0]);
});

test("erythemaRatio: separates flare from skin, never negative", () => {
  assert.ok(erythemaRatio(200, 70) > 0.4);
  assert.ok(erythemaRatio(224, 188) < 0.1);
  assert.equal(erythemaRatio(60, 200), 0); // clamped, not negative
  assert.equal(erythemaRatio(0, 0), 0);
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
  const onlySkin = computePhotoFeatures(solid(100, 100, INFLAMED), 100, 100);
  // Same inflamed skin, but now half the frame is the towel it's resting on.
  const withTowel = computePhotoFeatures(
    mix(100, 100, [[INFLAMED, 1], [GREY_TOWEL, 1]]),
    100,
    100
  );
  assert.ok(withTowel.skinFraction < 0.7, "towel must be excluded from the skin mask");
  assert.ok(
    Math.abs(withTowel.composite - onlySkin.composite) < 0.05,
    `backdrop shifted the composite from ${onlySkin.composite} to ${withTowel.composite}`
  );
  const graded = scorePhoto(withTowel, null);
  assert.ok(graded.ok && graded.score > 80, "an inflamed patch on a towel is still a flare");
});

test("rejects: too dark, and frames that are mostly background", () => {
  const dark = featuresOf(BLACK);
  assert.ok(dark.usableFraction < 0.2);
  assert.equal(rejectPhoto(dark), "too-dark");
  assert.deepEqual(scorePhoto(dark, null), { ok: false, reason: "too-dark" });

  // Mostly towel, a sliver of skin — grading this would grade the bedding.
  const mostlyTowel = computePhotoFeatures(
    mix(100, 100, [[GREY_TOWEL, 9], [INFLAMED, 1]]),
    100,
    100
  );
  assert.equal(rejectPhoto(mostlyTowel), "too-little-skin");
  assert.deepEqual(scorePhoto(mostlyTowel, null), { ok: false, reason: "too-little-skin" });

  assert.equal(rejectPhoto(featuresOf(CALM_PALE)), null);
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
  const today = { composite: 0.739, inflamedFraction: 0.6, rednessIndex: 0.3, usableFraction: 1, skinFraction: 1 };
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
    ["moderate", [210, 110, 95]],
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
