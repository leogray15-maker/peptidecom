// Unit tests for the Tier A photo severity heuristic (src/lib/photo-score.ts)
// and the Tier B label parsing (src/lib/photo-model.ts).
// Run with: npm run test:photo-score
import assert from "node:assert/strict";
import {
  computePhotoFeatures,
  estimateAgreement,
  pickBaseline,
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

/** Build a WxH RGBA buffer filled with one colour. */
function solid(w: number, h: number, [r, g, b]: [number, number, number]): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }
  return data;
}

const CALM_SKIN: [number, number, number] = [224, 188, 160]; // low-saturation beige
const INFLAMED: [number, number, number] = [200, 70, 60]; // saturated red
const BLACK: [number, number, number] = [4, 4, 4];

test("rgbToHsv: known colours", () => {
  assert.deepEqual(rgbToHsv(255, 0, 0), [0, 1, 1]); // pure red
  const [h, s, v] = rgbToHsv(0, 255, 0);
  assert.equal(h, 120);
  assert.equal(s, 1);
  assert.equal(v, 1);
  assert.deepEqual(rgbToHsv(0, 0, 0), [0, 0, 0]);
});

test("features: inflamed red scores far above calm skin", () => {
  const calm = computePhotoFeatures(solid(100, 100, CALM_SKIN), 100, 100);
  const inflamed = computePhotoFeatures(solid(100, 100, INFLAMED), 100, 100);
  assert.ok(inflamed.composite > calm.composite + 0.3, "red must dominate the composite");
  assert.ok(inflamed.inflamedFraction > 0.9);
  assert.ok(calm.inflamedFraction < 0.2);
});

test("features: too-dark image is flagged unusable and scores null", () => {
  const dark = computePhotoFeatures(solid(100, 100, BLACK), 100, 100);
  assert.ok(dark.usableFraction < 0.2);
  assert.equal(scorePhoto(dark, null), null);
});

test("scorePhoto: absolute scale orders calm < inflamed within 0–100", () => {
  const calm = computePhotoFeatures(solid(100, 100, CALM_SKIN), 100, 100);
  const inflamed = computePhotoFeatures(solid(100, 100, INFLAMED), 100, 100);
  const calmScore = scorePhoto(calm, null)!;
  const inflamedScore = scorePhoto(inflamed, null)!;
  assert.ok(calmScore >= 0 && inflamedScore <= 100);
  assert.ok(inflamedScore > calmScore + 30);
});

test("scorePhoto: baseline-relative anchors the calmest photo near 12", () => {
  const calm = computePhotoFeatures(solid(100, 100, CALM_SKIN), 100, 100);
  const inflamed = computePhotoFeatures(solid(100, 100, INFLAMED), 100, 100);
  assert.equal(scorePhoto(calm, { composite: calm.composite }), 12);
  const rel = scorePhoto(inflamed, { composite: calm.composite })!;
  assert.ok(rel > 50, `relative inflamed score should be high, got ${rel}`);
});

test("pickBaseline: prefers same-area, falls back to global minimum", () => {
  const photos = [
    { composite: 0.4, area: "face" },
    { composite: 0.1, area: "arms" },
    { composite: 0.2, area: "face" },
  ];
  assert.equal(pickBaseline(photos, "face")!.composite, 0.2);
  assert.equal(pickBaseline(photos, "legs")!.composite, 0.1); // no legs photos → global min
  assert.equal(pickBaseline(photos, null)!.composite, 0.1);
  assert.equal(pickBaseline([], "face"), null);
});

test("estimateAgreement: needs 5 pairs, detects a tracking heuristic", () => {
  assert.equal(estimateAgreement([[10, 2], [50, 5], [90, 9]]), null);
  const good: [number, number][] = [[10, 2], [25, 3], [40, 5], [60, 6], [85, 8], [95, 9]];
  const a = estimateAgreement(good)!;
  assert.equal(a.n, 6);
  assert.ok(a.r > 0.9);
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
