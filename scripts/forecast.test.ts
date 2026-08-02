// Unit tests for the flare-forecast risk engine (src/lib/forecast.ts).
// Run with: npm run test:forecast
import assert from "node:assert/strict";
import {
  type WeatherSnapshot,
  personalContext,
  riskBand,
  scoreFlareRisk,
} from "../src/lib/forecast";

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

console.log("Flare forecast");

/** A benign spring day: nothing in it should raise the score. */
const calm: WeatherSnapshot = {
  temperature: 20,
  humidity: 55,
  wind: 10,
  uv: 3,
  pollen: 5,
  observedAt: "2026-08-02T09:00:00.000Z",
};

test("a calm day scores 0 / LOW with a reassuring tip", () => {
  const r = scoreFlareRisk(calm);
  assert.equal(r.score, 0);
  assert.equal(r.band, "LOW");
  assert.equal(r.tone, "emerald");
  assert.equal(r.factors.length, 0);
  assert.ok(r.tips.length > 0, "a calm day still gets something to read");
  assert.match(r.tips[0], /favourable/i);
});

test("a brutal day stays inside 0–100 and reads VERY HIGH", () => {
  const brutal: WeatherSnapshot = {
    temperature: -5,
    humidity: 15,
    wind: 45,
    uv: 9,
    pollen: 120,
    observedAt: calm.observedAt,
  };
  const r = scoreFlareRisk(brutal, {
    personal: { recentSeverity: 9, recentBadFlare: true },
  });
  assert.ok(r.score > 0 && r.score <= 100, `expected 0 < score <= 100, got ${r.score}`);
  assert.equal(r.band, "VERY HIGH");
});

test("dry air raises the score and explains itself", () => {
  const r = scoreFlareRisk({ ...calm, humidity: 22 });
  assert.ok(r.score > 0);
  assert.ok(r.factors.some((f) => /dry/i.test(f.label)));
  assert.ok(r.tips.some((t) => /humid/i.test(t)));
});

test("factors come back strongest-first", () => {
  const r = scoreFlareRisk({ ...calm, temperature: -5, humidity: 20, wind: 20 });
  const points = r.factors.map((f) => f.points);
  assert.deepEqual(points, [...points].sort((a, b) => b - a));
});

test("condition weighting: cold dry air hits TSW harder than acne", () => {
  const cold: WeatherSnapshot = { ...calm, temperature: 1, humidity: 25 };
  const tsw = scoreFlareRisk(cold, { condition: "tsw" });
  const acne = scoreFlareRisk(cold, { condition: "acne" });
  assert.ok(tsw.score > acne.score, `tsw ${tsw.score} should beat acne ${acne.score}`);
});

test("condition weighting: heat and sun hit rosacea harder than psoriasis", () => {
  const hot: WeatherSnapshot = { ...calm, temperature: 30, uv: 8 };
  const rosacea = scoreFlareRisk(hot, { condition: "rosacea" });
  const psoriasis = scoreFlareRisk(hot, { condition: "psoriasis" });
  assert.ok(
    rosacea.score > psoriasis.score,
    `rosacea ${rosacea.score} should beat psoriasis ${psoriasis.score}`
  );
});

test("an unknown/missing condition falls back to the TSW weighting", () => {
  const cold: WeatherSnapshot = { ...calm, temperature: 1, humidity: 25 };
  assert.equal(
    scoreFlareRisk(cold, { condition: "not-a-condition" }).score,
    scoreFlareRisk(cold, { condition: "tsw" }).score
  );
  assert.equal(scoreFlareRisk(cold).score, scoreFlareRisk(cold, { condition: "tsw" }).score);
});

test("missing pollen/UV coverage doesn't invent a factor", () => {
  const r = scoreFlareRisk({ ...calm, pollen: null, uv: null });
  assert.equal(r.score, 0);
  assert.equal(r.factors.length, 0);
});

test("an already-flaring member gets a nudge the weather alone wouldn't give", () => {
  const plain = scoreFlareRisk(calm);
  const flaring = scoreFlareRisk(calm, { personal: { recentBadFlare: true } });
  assert.equal(plain.score, 0);
  assert.ok(flaring.score > 0);
  assert.ok(flaring.factors.some((f) => /flaring/i.test(f.label)));
});

test("bands map to the right labels at their edges", () => {
  assert.equal(riskBand(0).label, "LOW");
  assert.equal(riskBand(24).label, "LOW");
  assert.equal(riskBand(25).label, "MODERATE");
  assert.equal(riskBand(49).label, "MODERATE");
  assert.equal(riskBand(50).label, "HIGH");
  assert.equal(riskBand(74).label, "HIGH");
  assert.equal(riskBand(75).label, "VERY HIGH");
  assert.equal(riskBand(100).label, "VERY HIGH");
});

test("at most four tips are shown", () => {
  const r = scoreFlareRisk(
    { temperature: -5, humidity: 15, wind: 45, uv: 9, pollen: 120, observedAt: calm.observedAt },
    { personal: { recentBadFlare: true } }
  );
  assert.ok(r.tips.length <= 4, `got ${r.tips.length} tips`);
});

console.log("\npersonalContext");

test("summarises only the last few days of logs", () => {
  const ctx = personalContext(
    [
      { date: "2026-07-01", severity: 9 }, // old — must be ignored
      { date: "2026-08-01", severity: 4 },
      { date: "2026-08-02", severity: 6 },
    ],
    "2026-08-02",
    7
  );
  assert.equal(ctx.recentSeverity, 5);
  assert.equal(ctx.recentBadFlare, false);
});

test("flags a bad flare inside the window", () => {
  const ctx = personalContext(
    [
      { date: "2026-08-01", severity: 8 },
      { date: "2026-08-02", severity: 3 },
    ],
    "2026-08-02",
    7
  );
  assert.equal(ctx.recentBadFlare, true);
});

test("no logs means no personal context at all", () => {
  assert.deepEqual(personalContext([], "2026-08-02", 7), {});
});

console.log(`\n${passed} tests passed.`);
