// Unit tests for the pure insights maths (src/lib/insights.ts).
// Run with: npm run test:insights
import assert from "node:assert/strict";
import {
  MIN_COHORT,
  addDays,
  aggregateCohort,
  buildCohortStatements,
  computePersonalInsight,
  computeUserFeatures,
  median,
  pearson,
  rotateStatements,
  weeksSinceStart,
  type UserFeatures,
} from "../src/lib/insights";
import type { DailyLog } from "../src/lib/tsw";

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

const log = (date: string, severity: number, extra: Partial<DailyLog> = {}): DailyLog => ({
  date,
  severity,
  areas: [],
  symptoms: [],
  sleep: null,
  mood: null,
  note: null,
  ...extra,
});

// ─── primitives ──────────────────────────────────────────────────────────────

test("pearson: perfect positive correlation", () => {
  const pairs: [number, number][] = [1, 2, 3, 4, 5, 6, 7].map((x) => [x, 2 * x + 1]);
  assert.ok(Math.abs((pearson(pairs) ?? 0) - 1) < 1e-9);
});

test("pearson: needs 7+ pairs and variance", () => {
  assert.equal(pearson([[1, 2], [2, 3]]), null);
  const flat: [number, number][] = [1, 2, 3, 4, 5, 6, 7].map((x) => [3, x]);
  assert.equal(pearson(flat), null);
});

test("median: odd, even, empty", () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 2, 3]), 2.5);
  assert.equal(median([]), null);
});

test("addDays crosses month and year boundaries", () => {
  assert.equal(addDays("2026-01-31", 1), "2026-02-01");
  assert.equal(addDays("2025-12-31", 1), "2026-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

// ─── per-user features ───────────────────────────────────────────────────────

test("computeUserFeatures: sleep lag counts only consecutive logged days", () => {
  const logs = [
    log("2026-06-01", 4, { sleep: 1 }), // low sleep → next day 8 (flare)
    log("2026-06-02", 8, { sleep: 5 }), // high sleep → next day 3
    log("2026-06-03", 3, { sleep: 2 }), // low sleep, but June 5 isn't consecutive
    log("2026-06-05", 9, { sleep: 3 }), // mid sleep → ignored either way
  ];
  const f = computeUserFeatures(logs, [], {}, [])!;
  assert.equal(f.sleep.lowN, 1);
  assert.equal(f.sleep.lowFlares, 1);
  assert.equal(f.sleep.lowSevSum, 8);
  assert.equal(f.sleep.highN, 1);
  assert.equal(f.sleep.highFlares, 0);
  assert.equal(f.sleep.highSevSum, 3);
});

test("computeUserFeatures: trigger deltas need both days logged", () => {
  const logs = [log("2026-06-01", 4), log("2026-06-02", 7), log("2026-06-10", 5)];
  const triggers = [
    { date: "2026-06-01", kind: "stress", name: "Work deadline" }, // 4 → 7 = +3
    { date: "2026-06-10", kind: "stress", name: "Argument" }, // no next-day log
  ];
  const f = computeUserFeatures(logs, triggers, {}, [])!;
  assert.deepEqual(f.triggerDeltas.get("stress"), { n: 1, deltaSum: 3 });
});

test("computeUserFeatures: weekly buckets anchor on start date, else first log", () => {
  const logs = [log("2026-06-01", 6), log("2026-06-09", 4)];
  const anchored = computeUserFeatures(logs, [], { tswStartDate: "2026-05-25" }, [])!;
  assert.equal(anchored.severityByWeek.get(1), 6); // 7 days after start
  assert.equal(anchored.severityByWeek.get(2), 4); // 15 days after start
  const fallback = computeUserFeatures(logs, [], {}, [])!;
  assert.equal(fallback.severityByWeek.get(0), 6);
  assert.equal(fallback.severityByWeek.get(1), 4);
});

test("computeUserFeatures: stage durations from ordered events", () => {
  const f = computeUserFeatures(
    [log("2026-06-01", 5)],
    [],
    { recoveryStage: "middle" },
    [
      { stage: "early", at: "2026-01-01T00:00:00.000Z" },
      { stage: "middle", at: "2026-01-31T00:00:00.000Z" },
    ]
  )!;
  assert.equal(f.stageDurations.length, 1);
  assert.equal(f.stageDurations[0].from, "early");
  assert.equal(f.stageDurations[0].to, "middle");
  assert.equal(Math.round(f.stageDurations[0].days), 30);
});

test("computeUserFeatures: returns null for empty users", () => {
  assert.equal(computeUserFeatures([], [], {}, []), null);
});

// ─── cohort aggregation & privacy floor ──────────────────────────────────────

function fakeFeature(overrides: Partial<UserFeatures> = {}): UserFeatures {
  return {
    condition: "tsw",
    stage: "early",
    severityByWeek: new Map([[0, 7], [4, 5]]),
    sleep: { lowN: 4, lowFlares: 2, lowSevSum: 28, highN: 4, highFlares: 1, highSevSum: 16 },
    triggerDeltas: new Map([["stress", { n: 3, deltaSum: 4.5 }]]),
    stageDurations: [{ from: "early", to: "middle", days: 40 }],
    ...overrides,
  };
}

test(`aggregateCohort: suppresses everything below MIN_COHORT (${MIN_COHORT})`, () => {
  const agg = aggregateCohort(Array.from({ length: MIN_COHORT - 1 }, () => fakeFeature()));
  assert.equal(agg.sleepNextDay, null);
  assert.equal(agg.triggerKinds.length, 0);
  assert.deepEqual(agg.byCondition, {});
});

test("aggregateCohort: publishes at MIN_COHORT with correct values", () => {
  const agg = aggregateCohort(Array.from({ length: MIN_COHORT }, () => fakeFeature()));
  assert.deepEqual(agg.byCondition.tsw.severityByWeek, [
    { week: 0, avgSeverity: 7, nUsers: MIN_COHORT },
    { week: 4, avgSeverity: 5, nUsers: MIN_COHORT },
  ]);
  assert.ok(agg.sleepNextDay);
  assert.equal(agg.sleepNextDay!.nUsers, MIN_COHORT);
  assert.equal(agg.sleepNextDay!.lowFlareRate, 0.5);
  assert.equal(agg.sleepNextDay!.highFlareRate, 0.25);
  assert.equal(agg.triggerKinds[0].kind, "stress");
  assert.equal(agg.triggerKinds[0].avgNextDayDelta, 1.5);
  assert.equal(agg.byCondition.tsw.stageTransitions[0].medianDays, 40);
});

test("aggregateCohort: pools sleep across conditions, segments the curves", () => {
  // 15 TSW + 15 acne users: neither condition clears MIN_COHORT alone for
  // curves/stages, but pooled sleep (30 users) does.
  const features = [
    ...Array.from({ length: 15 }, () => fakeFeature()),
    ...Array.from({ length: 15 }, () =>
      fakeFeature({ condition: "acne", stage: "active", stageDurations: [{ from: "active", to: "treatment", days: 20 }] })
    ),
  ];
  const agg = aggregateCohort(features);
  assert.ok(agg.sleepNextDay, "pooled sleep stat should publish at 30 users");
  assert.equal(agg.sleepNextDay!.nUsers, 30);
  assert.deepEqual(agg.byCondition, {}, "per-condition segments must stay suppressed below the floor");
});

test("aggregate output contains no identifying fields", () => {
  const agg = aggregateCohort(Array.from({ length: MIN_COHORT }, () => fakeFeature()));
  const json = JSON.stringify(agg).toLowerCase();
  for (const banned of ["uid", "email", "name", "note"]) {
    assert.ok(!json.includes(`"${banned}"`), `aggregate JSON must not contain "${banned}"`);
  }
});

// ─── statements & rotation ───────────────────────────────────────────────────

test("buildCohortStatements: user's own stage transition ranks first", () => {
  const agg = aggregateCohort(Array.from({ length: MIN_COHORT }, () => fakeFeature()));
  const statements = buildCohortStatements(agg, {
    stage: "early",
    weeksSinceStart: 1,
    condition: "tsw",
  });
  assert.ok(statements.length >= 3);
  assert.equal(statements[0].id, "stage-early-middle");
  assert.ok(statements[0].text.includes("From where you are"));
});

test("buildCohortStatements: another condition still gets the pooled stats", () => {
  const agg = aggregateCohort(Array.from({ length: MIN_COHORT }, () => fakeFeature()));
  const statements = buildCohortStatements(agg, { stage: "active", condition: "acne" });
  // No acne segment exists → no curve/stage statements, but pooled sleep and
  // trigger stats still apply.
  assert.ok(statements.length >= 1);
  assert.ok(statements.every((s) => !s.id.startsWith("stage-") && !s.id.startsWith("curve")));
});

test("rotateStatements: keeps top stat, deterministic within a day, bounded", () => {
  const stmts = Array.from({ length: 6 }, (_, i) => ({
    id: `s${i}`,
    text: `stat ${i}`,
    relevance: 6 - i,
  }));
  const day = new Date("2026-07-13T10:00:00Z");
  const a = rotateStatements(stmts, 3, day);
  const b = rotateStatements(stmts, 3, day);
  assert.deepEqual(a, b);
  assert.ok(a.length <= 3);
  assert.equal(a[0].id, "s0");
  const tomorrow = rotateStatements(stmts, 3, new Date("2026-07-14T10:00:00Z"));
  assert.notDeepEqual(a.map((s) => s.id), tomorrow.map((s) => s.id));
});

// ─── personal insight ────────────────────────────────────────────────────────

test("computePersonalInsight: finds the top trigger by name", () => {
  const logs = [
    log("2026-07-01", 4), log("2026-07-02", 7),
    log("2026-07-05", 3), log("2026-07-06", 6),
    log("2026-07-09", 4), log("2026-07-10", 6),
  ];
  const triggers = ["2026-07-01", "2026-07-05", "2026-07-09"].map((date) => ({
    date,
    kind: "food",
    name: "Dairy",
  }));
  const insight = computePersonalInsight(logs, triggers, "2026-07-13");
  assert.ok(insight);
  assert.ok(insight!.headline.includes("Dairy"));
});

test("computePersonalInsight: falls back to sleep correlation, then null", () => {
  // 8 consecutive days where worse sleep → worse next day (negative r).
  const sleeps = [5, 5, 4, 3, 3, 2, 1, 1];
  const logs = sleeps.map((s, i) =>
    log(addDays("2026-07-01", i), 2 + Math.round((5 - s) * 1.2), { sleep: s })
  );
  const insight = computePersonalInsight(logs, [], "2026-07-13");
  assert.ok(insight);
  assert.ok(insight!.headline.toLowerCase().includes("sleep"));

  assert.equal(computePersonalInsight([log("2026-07-01", 5)], [], "2026-07-13"), null);
});

test("weeksSinceStart: prefers start date, falls back to first log", () => {
  const logs = [log("2026-06-15", 5)];
  assert.equal(weeksSinceStart(logs, { tswStartDate: "2026-05-04" }, "2026-07-13"), 10);
  assert.equal(weeksSinceStart(logs, {}, "2026-07-13"), 4);
  assert.equal(weeksSinceStart([], {}, "2026-07-13"), null);
});

console.log(`\n${passed} insights tests passed.`);
