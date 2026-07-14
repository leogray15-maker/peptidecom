// Unit tests for dose-protocol scheduling (src/lib/protocol-schedule.ts).
// Run with: npm run test:protocols
import assert from "node:assert/strict";
import { addDays } from "../src/lib/insights";
import {
  type PeptideProtocol,
  computeAdherence,
  isDueOn,
  scheduleLabel,
  weekdayOf,
} from "../src/lib/protocol-schedule";

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

function protocol(overrides: Partial<PeptideProtocol> = {}): PeptideProtocol {
  return {
    id: "p1",
    peptide: "BPC-157",
    doseMg: 0.5,
    schedule: { type: "daily" },
    active: true,
    createdAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

// 2026-07-13 is a Monday, 2026-07-14 a Tuesday.
test("weekdayOf: known dates", () => {
  assert.equal(weekdayOf("2026-07-13"), 1); // Mon
  assert.equal(weekdayOf("2026-07-12"), 0); // Sun
});

test("isDueOn: daily, weekly, paused", () => {
  assert.ok(isDueOn(protocol(), "2026-07-13"));
  const monThu = protocol({ schedule: { type: "weekly", days: [1, 4] } });
  assert.ok(isDueOn(monThu, "2026-07-13")); // Mon
  assert.ok(!isDueOn(monThu, "2026-07-14")); // Tue
  assert.ok(!isDueOn(protocol({ active: false }), "2026-07-13"));
});

test("scheduleLabel: daily, day list, all-7 collapses to Daily", () => {
  assert.equal(scheduleLabel({ type: "daily" }), "Daily");
  assert.equal(scheduleLabel({ type: "weekly", days: [4, 1] }), "Mon, Thu");
  assert.equal(scheduleLabel({ type: "weekly", days: [0, 1, 2, 3, 4, 5, 6] }), "Daily");
});

test("computeAdherence: today rows, name-matched logging (case-insensitive)", () => {
  const protocols = [
    protocol(),
    protocol({ id: "p2", peptide: "TB-500", schedule: { type: "weekly", days: [1] } }),
  ];
  const logs = [{ date: "2026-07-13", peptide: "bpc-157" }];
  const a = computeAdherence(protocols, logs, "2026-07-13", addDays);
  assert.equal(a.today.length, 2); // Monday: both due
  assert.equal(a.today.find((t) => t.protocol.id === "p1")!.logged, true);
  assert.equal(a.today.find((t) => t.protocol.id === "p2")!.logged, false);
});

test("computeAdherence: streak counts full days, ignores no-dose days, unfinished today is neutral", () => {
  const monThu = [
    protocol({ id: "p2", peptide: "TB-500", schedule: { type: "weekly", days: [1, 4] } }),
  ];
  // Logged the previous Thu (Jul 9) and Mon (Jul 6); today (Mon Jul 13) not yet.
  const logs = [
    { date: "2026-07-09", peptide: "TB-500" },
    { date: "2026-07-06", peptide: "TB-500" },
  ];
  const a = computeAdherence(monThu, logs, "2026-07-13", addDays);
  assert.equal(a.streak, 2, "two completed dose-days, today pending doesn't break it");

  // Once today is logged the streak becomes 3.
  const b = computeAdherence(
    monThu,
    [...logs, { date: "2026-07-13", peptide: "TB-500" }],
    "2026-07-13",
    addDays
  );
  assert.equal(b.streak, 3);

  // A missed dose-day breaks it: skip Thu Jul 9.
  const c = computeAdherence(
    monThu,
    [{ date: "2026-07-13", peptide: "TB-500" }, { date: "2026-07-06", peptide: "TB-500" }],
    "2026-07-13",
    addDays
  );
  assert.equal(c.streak, 1);
});

test("computeAdherence: week strip covers the last 7 days with due/logged counts", () => {
  const a = computeAdherence(
    [protocol()],
    [{ date: "2026-07-13", peptide: "BPC-157" }],
    "2026-07-13",
    addDays
  );
  assert.equal(a.week.length, 7);
  assert.equal(a.week[0].date, "2026-07-07");
  assert.equal(a.week[6].date, "2026-07-13");
  assert.equal(a.week[6].due, 1);
  assert.equal(a.week[6].logged, 1);
  assert.equal(a.week[5].logged, 0);
});

test("computeAdherence: no active protocols → empty today, zero streak", () => {
  const a = computeAdherence([protocol({ active: false })], [], "2026-07-13", addDays);
  assert.equal(a.today.length, 0);
  assert.equal(a.streak, 0);
});

console.log(`\n${passed} protocol-schedule tests passed.`);
