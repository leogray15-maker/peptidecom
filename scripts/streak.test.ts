// Unit tests for the tracking streak and the flare-day grace pass
// (src/lib/tsw.ts computeStreak / computeStats).
// Run with: npm run test:streak
import assert from "node:assert/strict";
import {
  BAD_FLARE_SEVERITY,
  GRACE_WINDOW_DAYS,
  type DailyLog,
  computeStats,
  computeStreak,
  wasLoggedSameDay,
} from "../src/lib/tsw";

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

const TODAY = "2026-07-20";

function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function daysApart(a: string, b: string): number {
  return Math.abs((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/** A log. `loggedOn` defaults to the day itself (same-day). Pass `backfilled`
 * to simulate someone filling the entry in afterwards. */
function log(
  date: string,
  severity: number,
  opts: { backfilled?: boolean } = {}
): DailyLog {
  return {
    date,
    severity,
    areas: [],
    symptoms: [],
    sleep: null,
    mood: null,
    loggedOn: opts.backfilled ? addDays(date, 3) : date,
  };
}

/** N consecutive calm days ending `endingDaysAgo` before TODAY. */
function run(n: number, endingDaysAgo = 0, severity = 4): DailyLog[] {
  return Array.from({ length: n }, (_, i) =>
    log(addDays(TODAY, -(endingDaysAgo + n - 1 - i)), severity)
  );
}

// ─── the ordinary cases ──────────────────────────────────────────────────────

test("empty logs: no streak, grace untouched", () => {
  const r = computeStreak([], TODAY);
  assert.equal(r.streak, 0);
  assert.equal(r.usedGrace, false);
  assert.equal(r.graceAvailable, true);
});

test("consecutive days ending today count in full", () => {
  assert.equal(computeStreak(run(5), TODAY).streak, 5);
});

test("last log yesterday keeps the streak alive", () => {
  assert.equal(computeStreak(run(3, 1), TODAY).streak, 3);
});

test("a plain gap breaks the streak at the gap", () => {
  // Calm days either side of a missed day: no bad flare, so no pass.
  const logs = [...run(4, 6), ...run(3, 0)];
  const r = computeStreak(logs, TODAY);
  assert.equal(r.streak, 3);
  assert.equal(r.usedGrace, false);
});

// ─── using the grace day ─────────────────────────────────────────────────────

test("grace bridges one missed day after a same-day bad-flare log", () => {
  // day -4 bad flare, day -3 missed, days -2..0 logged.
  const logs = [
    ...run(2, 5), // days -6, -5
    log(addDays(TODAY, -4), BAD_FLARE_SEVERITY),
    ...run(3, 0), // days -2, -1, 0
  ];
  const r = computeStreak(logs, TODAY);
  assert.equal(r.streak, 6, "all six logged days count, the gap is bridged");
  assert.equal(r.usedGrace, true);
  assert.deepEqual(r.graceDatesUsed, [addDays(TODAY, -4)]);
});

test("grace also covers a missed day between the last log and today", () => {
  // Days -5, -4, -3 logged, day -2 a bad flare, day -1 missed, today not
  // logged yet — the streak survives on the pass.
  const logs = [...run(3, 3), log(addDays(TODAY, -2), BAD_FLARE_SEVERITY)];
  const r = computeStreak(logs, TODAY);
  assert.equal(r.streak, 4);
  assert.equal(r.usedGrace, true);
  assert.deepEqual(r.graceDatesUsed, [addDays(TODAY, -2)]);
});

test("a calm day earns no pass — only bad-flare days do", () => {
  const logs = [
    ...run(2, 5),
    log(addDays(TODAY, -4), BAD_FLARE_SEVERITY - 1), // one point short
    ...run(3, 0),
  ];
  assert.equal(computeStreak(logs, TODAY).streak, 3);
});

test("marking a day bad retroactively does not consume grace", () => {
  const logs = [
    ...run(2, 5),
    log(addDays(TODAY, -4), BAD_FLARE_SEVERITY, { backfilled: true }),
    ...run(3, 0),
  ];
  const r = computeStreak(logs, TODAY);
  assert.equal(r.streak, 3, "backfilled bad days can't rescue a broken streak");
  assert.equal(r.usedGrace, false);
});

test("legacy logs with no loggedOn are treated as same-day", () => {
  const legacy: DailyLog = {
    date: addDays(TODAY, -4),
    severity: BAD_FLARE_SEVERITY,
    areas: [],
    symptoms: [],
    sleep: null,
    mood: null,
  };
  assert.equal(wasLoggedSameDay(legacy), true);
  assert.equal(computeStreak([...run(2, 5), legacy, ...run(3, 0)], TODAY).streak, 6);
});

// ─── running out of grace ────────────────────────────────────────────────────

test("only one pass per rolling 7-day window", () => {
  // Two bad-flare days three days apart, each followed by a missed day. The
  // second pass falls inside the first one's window and is refused.
  const logs = [
    ...run(2, 9), // days -10, -9
    log(addDays(TODAY, -8), BAD_FLARE_SEVERITY), // pass candidate A
    // day -7 missed
    ...run(2, 5), // days -6, -5
    log(addDays(TODAY, -4), BAD_FLARE_SEVERITY), // pass candidate B
    // day -3 missed
    ...run(3, 0), // days -2, -1, 0
  ];
  const r = computeStreak(logs, TODAY);
  // Walking back: B's pass is spent first, A's is inside the same window.
  assert.equal(r.streak, 6);
  assert.deepEqual(r.graceDatesUsed, [addDays(TODAY, -4)]);
});

test("a second pass is allowed once the window has rolled over", () => {
  const older = addDays(TODAY, -(GRACE_WINDOW_DAYS + 4)); // day -11
  const logs = [
    ...run(2, 12), // days -13, -12
    log(older, BAD_FLARE_SEVERITY), // pass A (day -11)
    // day -10 missed
    ...run(5, 5), // days -9 … -5
    log(addDays(TODAY, -4), BAD_FLARE_SEVERITY), // pass B (day -4)
    // day -3 missed
    ...run(3, 0), // days -2, -1, 0
  ];
  const r = computeStreak(logs, TODAY);
  assert.equal(r.graceDatesUsed.length, 2, "passes 7+ days apart both apply");
  assert.equal(
    daysApart(r.graceDatesUsed[1], r.graceDatesUsed[0]),
    GRACE_WINDOW_DAYS,
    "exactly at the window boundary — the second pass is still allowed"
  );
  assert.equal(r.streak, 12);
});

test("two consecutive missed days always reset, flare or not", () => {
  const logs = [
    ...run(2, 5), // days -6, -5
    log(addDays(TODAY, -4), BAD_FLARE_SEVERITY),
    // days -3 and -2 both missed — beyond what one pass can bridge
    ...run(2, 0), // days -1, 0
  ];
  const r = computeStreak(logs, TODAY);
  assert.equal(r.streak, 2);
  assert.equal(r.usedGrace, false);
});

test("missing entirely beyond the allowance resets to 0 but keeps days tracked", () => {
  // Last log five days ago, and it was calm — nothing to bridge.
  const logs = run(9, 5);
  const stats = computeStats(logs, TODAY);
  assert.equal(stats.streak, 0);
  assert.equal(stats.streakUsedGrace, false);
  assert.equal(stats.daysTracked, 9, "total days logged must survive a reset");
});

test("a long absence after a bad flare still resets", () => {
  const logs = [...run(4, 10), log(addDays(TODAY, -6), BAD_FLARE_SEVERITY)];
  const stats = computeStats(logs, TODAY);
  assert.equal(stats.streak, 0);
  assert.equal(stats.daysTracked, 5);
});

// ─── computeStats wiring ─────────────────────────────────────────────────────

test("computeStats surfaces grace state alongside the streak", () => {
  const logs = [
    ...run(2, 5),
    log(addDays(TODAY, -4), BAD_FLARE_SEVERITY),
    ...run(3, 0),
  ];
  const stats = computeStats(logs, TODAY);
  assert.equal(stats.streak, 6);
  assert.equal(stats.streakUsedGrace, true);
  assert.equal(stats.graceAvailable, false, "the pass was just spent");
  assert.equal(stats.daysTracked, 6);
});

test("a clean streak reports grace as still available", () => {
  const stats = computeStats(run(10), TODAY);
  assert.equal(stats.streak, 10);
  assert.equal(stats.streakUsedGrace, false);
  assert.equal(stats.graceAvailable, true);
});

console.log(`\n${passed} streak tests passed.`);
