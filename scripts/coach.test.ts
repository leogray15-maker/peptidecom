// Unit tests for the coach (src/lib/coach.ts).
// Run with: npm run test:coach
import assert from "node:assert/strict";
import { type CoachInput, coachActions, coachObservations } from "../src/lib/coach";
import { type DailyLog, summariseItch } from "../src/lib/tsw";

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

const log = (date: string, severity: number): DailyLog => ({
  date,
  areas: ["arms"],
  severity,
  symptoms: ["itch"],
  sleep: 3,
  mood: 3,
});

/** Day offsets back from TODAY, as date keys. */
const ago = (n: number) => new Date(Date.UTC(2026, 7, 2 - n)).toISOString().slice(0, 10);

const base: CoachInput = {
  today: TODAY,
  logs: [],
  triggers: [],
  itch: summariseItch([], TODAY),
  lastPhotoDate: null,
  lastPoemAt: null,
  todayForecast: null,
  hasForecastLocation: false,
};

const ids = (input: CoachInput) => coachActions(input).map((a) => a.id);

console.log("Coach — actions");

test("a member who hasn't logged today is told to, first", () => {
  const list = coachActions(base);
  assert.equal(list[0].id, "log-today");
});

test("logging today removes that action", () => {
  assert.ok(!ids({ ...base, logs: [log(TODAY, 4)] }).includes("log-today"));
});

test("actions come back highest-priority first", () => {
  const list = coachActions({ ...base, itch: summariseItch([{ date: TODAY, at: `${TODAY}T20:00:00.000Z`, level: 9 }], TODAY) });
  const priorities = list.map((a) => a.priority);
  assert.deepEqual(priorities, [...priorities].sort((a, b) => b - a));
});

test("a bad itch day surfaces flare-day support", () => {
  const itch = summariseItch([{ date: TODAY, at: `${TODAY}T21:00:00.000Z`, level: 8 }], TODAY);
  assert.ok(ids({ ...base, itch }).includes("support"));
});

test("a mild itch day doesn't", () => {
  const itch = summariseItch([{ date: TODAY, at: `${TODAY}T21:00:00.000Z`, level: 3 }], TODAY);
  assert.ok(!ids({ ...base, itch }).includes("support"));
});

test("a high forecast is raised; a low one isn't", () => {
  assert.ok(
    ids({ ...base, hasForecastLocation: true, todayForecast: { score: 62, band: "HIGH" } }).includes(
      "forecast-high"
    )
  );
  assert.ok(
    !ids({ ...base, hasForecastLocation: true, todayForecast: { score: 12, band: "LOW" } }).includes(
      "forecast-high"
    )
  );
});

test("the forecast setup nudge only shows before it's been set up", () => {
  assert.ok(ids(base).includes("forecast-setup"));
  assert.ok(!ids({ ...base, hasForecastLocation: true }).includes("forecast-setup"));
});

test("POEM is due weekly, not daily", () => {
  assert.ok(ids({ ...base, lastPoemAt: `${ago(2)}T09:00:00.000Z` }).includes("poem") === false);
  assert.ok(ids({ ...base, lastPoemAt: `${ago(9)}T09:00:00.000Z` }).includes("poem"));
  assert.ok(ids(base).includes("poem"), "never scored = due");
});

test("photos are prompted weekly", () => {
  assert.ok(!ids({ ...base, lastPhotoDate: ago(3) }).includes("photo"));
  assert.ok(ids({ ...base, lastPhotoDate: ago(8) }).includes("photo"));
});

test("trigger catch-up waits until there's a tracking habit to build on", () => {
  assert.ok(!ids(base).includes("triggers"), "no logs yet — don't pile on");
  const withLogs = { ...base, logs: [log(ago(1), 4), log(ago(2), 5), log(ago(3), 4)] };
  assert.ok(ids(withLogs).includes("triggers"));
  assert.ok(
    !ids({ ...withLogs, triggers: [{ date: TODAY, name: "Alcohol", effect: -1 }] }).includes(
      "triggers"
    )
  );
});

console.log("\nCoach — observations");

test("says nothing at all without enough logged days", () => {
  assert.deepEqual(coachObservations(base), []);
});

test("spots a calmer week", () => {
  const logs = [
    ...[7, 8, 9, 10].map((d) => log(ago(d), 7)),
    ...[0, 1, 2, 3].map((d) => log(ago(d), 4)),
  ];
  const out = coachObservations({ ...base, logs });
  assert.ok(out.some((o) => /calmer/i.test(o.headline)), JSON.stringify(out));
});

test("spots a worse week", () => {
  const logs = [
    ...[7, 8, 9, 10].map((d) => log(ago(d), 3)),
    ...[0, 1, 2, 3].map((d) => log(ago(d), 7)),
  ];
  const out = coachObservations({ ...base, logs });
  assert.ok(out.some((o) => /hotter/i.test(o.headline)), JSON.stringify(out));
});

test("a repeatedly-flagged trigger is called out, a one-off isn't", () => {
  const thrice = [1, 5, 9].map((d) => ({ date: ago(d), name: "Alcohol", effect: -1 }));
  const out = coachObservations({ ...base, triggers: thrice });
  assert.ok(out.some((o) => /Alcohol/.test(o.headline)));

  const once = coachObservations({ ...base, triggers: [thrice[0]] });
  assert.ok(!once.some((o) => /Alcohol/.test(o.headline)));
});

test("triggers that helped are never reported as culprits", () => {
  const helped = [1, 5, 9].map((d) => ({ date: ago(d), name: "Oat bath", effect: 1 }));
  assert.ok(!coachObservations({ ...base, triggers: helped }).some((o) => /Oat bath/.test(o.headline)));
});

console.log(`\n${passed} tests passed.`);
