// Unit tests for the EASI calculator (src/lib/easi.ts).
// Run with: npm run test:easi
import assert from "node:assert/strict";
import {
  EASI_REGIONS,
  type EasiInput,
  easiBand,
  easiScore,
  emptyEasiInput,
  regionScore,
} from "../src/lib/easi";

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

console.log("EASI calculator");

test("empty input scores 0", () => {
  assert.equal(easiScore(emptyEasiInput()), 0);
});

test("region multipliers are the adult standard", () => {
  const m = Object.fromEntries(EASI_REGIONS.map((r) => [r.id, r.multiplier]));
  assert.equal(m.head, 0.1);
  assert.equal(m.trunk, 0.3);
  assert.equal(m.upper, 0.2);
  assert.equal(m.lower, 0.4);
});

test("single region contribution = area × signSum × multiplier", () => {
  const trunk = EASI_REGIONS.find((r) => r.id === "trunk")!;
  // area 3, signs sum to 8 (3+2+2+1) → 3 × 8 × 0.3 = 7.2
  const contribution = regionScore(trunk, {
    area: 3,
    signs: { erythema: 3, edema: 2, excoriation: 2, lichenification: 1 },
  });
  assert.equal(Math.round(contribution * 10) / 10, 7.2);
});

test("maximum score is 72", () => {
  const max: EasiInput = emptyEasiInput();
  for (const r of EASI_REGIONS) {
    max[r.id] = {
      area: 6,
      signs: { erythema: 3, edema: 3, excoriation: 3, lichenification: 3 },
    };
  }
  // each region: 6 × 12 × mult; sum of mults = 1.0 → 72
  assert.equal(easiScore(max), 72);
});

test("out-of-range values are clamped, not trusted", () => {
  const trunk = EASI_REGIONS.find((r) => r.id === "trunk")!;
  const contribution = regionScore(trunk, {
    area: 99,
    signs: { erythema: 9, edema: -4, excoriation: 0, lichenification: 0 },
  });
  // clamps to area 6, signs 3+0+0+0=3 → 6 × 3 × 0.3 = 5.4
  assert.equal(Math.round(contribution * 10) / 10, 5.4);
});

test("severity bands follow the standard strata", () => {
  assert.equal(easiBand(0).label, "Clear");
  assert.equal(easiBand(0.8).label, "Almost clear");
  assert.equal(easiBand(5).label, "Mild");
  assert.equal(easiBand(15).label, "Moderate");
  assert.equal(easiBand(40).label, "Severe");
  assert.equal(easiBand(60).label, "Very severe");
});

console.log(`\n${passed} EASI tests passed.\n`);
