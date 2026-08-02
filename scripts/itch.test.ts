// Unit tests for the itch summary (src/lib/tsw.ts summariseItch) and the
// local-first merge that keeps two devices in step (src/lib/synced-store.ts).
// Run with: npm run test:itch
import assert from "node:assert/strict";
import { type ItchPoint, itchBand, summariseItch } from "../src/lib/tsw";
import { type SyncedEntry, mergeEntries } from "../src/lib/synced-store";

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

const TODAY = "2026-08-02";
const at = (date: string, hour: number) =>
  `${date}T${String(hour).padStart(2, "0")}:00:00.000Z`;
const point = (date: string, hour: number, level: number): ItchPoint => ({
  date,
  at: at(date, hour),
  level,
});

console.log("Itch summary");

test("no check-ins summarises to nothing rather than zero", () => {
  const s = summariseItch([], TODAY);
  assert.equal(s.todayCount, 0);
  assert.equal(s.todayAvg, null);
  assert.equal(s.todayPeak, null);
  assert.equal(s.weekAvg, null);
  assert.equal(s.worstHour, null);
});

test("today's average and peak come from today only", () => {
  const s = summariseItch(
    [point(TODAY, 9, 4), point(TODAY, 21, 8), point("2026-08-01", 9, 10)],
    TODAY
  );
  assert.equal(s.todayCount, 2);
  assert.equal(s.todayAvg, 6);
  assert.equal(s.todayPeak, 8);
});

test("the week is always seven days, oldest first, gaps included", () => {
  const s = summariseItch([point(TODAY, 9, 6)], TODAY);
  assert.equal(s.week.length, 7);
  assert.equal(s.week[6].date, TODAY);
  assert.equal(s.week[6].avg, 6);
  assert.equal(s.week[0].avg, null, "a day with no check-ins is null, not 0");
  assert.deepEqual(
    [...s.week].map((d) => d.date),
    [...s.week].map((d) => d.date).sort()
  );
});

test("the 7-day average ignores anything older than the window", () => {
  const s = summariseItch([point(TODAY, 9, 4), point("2026-06-01", 9, 10)], TODAY);
  assert.equal(s.weekAvg, 4);
});

test("no worst hour is claimed from a handful of check-ins", () => {
  const few = [point(TODAY, 22, 9), point(TODAY, 22, 9), point(TODAY, 22, 9)];
  assert.equal(summariseItch(few, TODAY).worstHour, null);
});

test("with enough history the worst hour is the one that averages highest", () => {
  const points: ItchPoint[] = [];
  for (let d = 1; d <= 7; d++) {
    const date = `2026-07-${String(d).padStart(2, "0")}`;
    points.push(point(date, 22, 9)); // evenings are bad
    points.push(point(date, 10, 2)); // mornings are fine
  }
  const s = summariseItch(points, TODAY);
  assert.equal(s.worstHour, new Date(at("2026-07-01", 22)).getHours());
});

test("bands read the way the number feels", () => {
  assert.equal(itchBand(0).label, "None");
  assert.equal(itchBand(2).label, "Mild");
  assert.equal(itchBand(5).label, "Nagging");
  assert.equal(itchBand(7).label, "Intense");
  assert.equal(itchBand(10).label, "Unbearable");
});

console.log("\nCross-device merge");

const entry = (at: string, score: number): SyncedEntry<null> => ({ at, score, detail: null });

test("two devices' lists union, oldest first", () => {
  const phone = [entry("2026-08-01T09:00:00.000Z", 1)];
  const laptop = [entry("2026-08-02T09:00:00.000Z", 2)];
  const merged = mergeEntries(phone, laptop, 60);
  assert.deepEqual(merged.map((e) => e.score), [1, 2]);
});

test("syncing the same entry twice can't duplicate it", () => {
  const one = [entry("2026-08-01T09:00:00.000Z", 1)];
  assert.equal(mergeEntries(one, one, 60).length, 1);
  assert.equal(mergeEntries(mergeEntries(one, one, 60), one, 60).length, 1);
});

test("the limit drops the oldest, never the newest", () => {
  const many = Array.from({ length: 10 }, (_, i) =>
    entry(`2026-08-${String(i + 1).padStart(2, "0")}T09:00:00.000Z`, i)
  );
  const merged = mergeEntries(many, [], 3);
  assert.deepEqual(merged.map((e) => e.score), [7, 8, 9]);
});

test("malformed entries are dropped rather than crashing the tool", () => {
  const junk = [null, { score: 1 }, "nope"] as unknown as SyncedEntry<null>[];
  const merged = mergeEntries(junk, [entry("2026-08-01T09:00:00.000Z", 1)], 60);
  assert.equal(merged.length, 1);
});

console.log(`\n${passed} tests passed.`);
