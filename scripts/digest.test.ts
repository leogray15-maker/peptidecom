// Unit tests for the weekly digest payload and the notification gating
// (src/lib/digest.ts, src/lib/notifications.ts).
// Run with: npm run test:digest
import assert from "node:assert/strict";
import { MIN_LOGS_FOR_DIGEST, buildDigest } from "../src/lib/digest";
import {
  DEFAULT_DIGEST_PREFS,
  type DigestPrefs,
  isQuietHour,
  localHour,
  pushDecision,
  quietWindowEnd,
  resolveDigestPrefs,
} from "../src/lib/notifications";
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

const TODAY = "2026-07-20";

function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function log(date: string, severity: number, sleep: number | null = null): DailyLog {
  return { date, severity, areas: [], symptoms: [], sleep, mood: null, loggedOn: date };
}

const week = (n: number) =>
  Array.from({ length: n }, (_, i) => log(addDays(TODAY, -(n - 1 - i)), 5));

const prefs = (over: Partial<DigestPrefs> = {}): DigestPrefs => ({
  ...DEFAULT_DIGEST_PREFS,
  ...over,
});

// ─── quiet hours ─────────────────────────────────────────────────────────────

test("isQuietHour: same-day window", () => {
  assert.equal(isQuietHour(12, 13, 15), false);
  assert.equal(isQuietHour(13, 13, 15), true);
  assert.equal(isQuietHour(14, 13, 15), true);
  assert.equal(isQuietHour(15, 13, 15), false, "end hour is exclusive");
});

test("isQuietHour: overnight window wraps midnight", () => {
  for (const h of [21, 22, 23, 0, 3, 7]) {
    assert.equal(isQuietHour(h, 21, 8), true, `${h}:00 should be quiet`);
  }
  for (const h of [8, 12, 20]) {
    assert.equal(isQuietHour(h, 21, 8), false, `${h}:00 should not be quiet`);
  }
});

test("isQuietHour: an empty window means no quiet hours", () => {
  for (const h of [0, 9, 23]) assert.equal(isQuietHour(h, 9, 9), false);
});

test("localHour: applies the member's UTC offset", () => {
  const at = new Date("2026-07-20T22:30:00.000Z");
  assert.equal(localHour(at, 0), 22);
  assert.equal(localHour(at, 120), 0, "UTC+2 has rolled past midnight");
  assert.equal(localHour(at, -300), 17, "UTC-5 is still early evening");
});

// ─── push gating ─────────────────────────────────────────────────────────────

test("pushDecision: opt-in is checked before anything else", () => {
  const d = pushDecision(prefs({ enabled: false }), new Date("2026-07-20T12:00:00.000Z"));
  assert.equal(d.send, false);
  assert.equal(d.send === false && d.reason, "not-opted-in");
});

test("pushDecision: sends outside quiet hours", () => {
  const d = pushDecision(
    prefs({ enabled: true, quietStart: 21, quietEnd: 8 }),
    new Date("2026-07-20T12:00:00.000Z")
  );
  assert.equal(d.send, true);
});

test("pushDecision: defers rather than drops inside quiet hours", () => {
  const now = new Date("2026-07-20T23:30:00.000Z");
  const d = pushDecision(prefs({ enabled: true, quietStart: 21, quietEnd: 8 }), now);
  assert.equal(d.send, false);
  assert.equal(d.send === false && d.reason, "quiet-hours");
  const until = d.send === false && d.reason === "quiet-hours" ? d.deferUntil : null;
  assert.ok(until && until > now, "must defer forwards in time");
  assert.equal(localHour(until!, 0), 8, "resumes exactly when quiet hours end");
});

test("pushDecision: quiet hours follow the member's timezone, not the server's", () => {
  const now = new Date("2026-07-20T12:00:00.000Z"); // midday UTC
  // UTC+13: it's 01:00 the next day for this member — squarely in quiet hours.
  const d = pushDecision(
    prefs({ enabled: true, quietStart: 21, quietEnd: 8, utcOffsetMinutes: 780 }),
    now
  );
  assert.equal(d.send, false);
  assert.equal(d.send === false && d.reason, "quiet-hours");
});

test("quietWindowEnd: lands on the top of the hour quiet hours end", () => {
  const end = quietWindowEnd(
    new Date("2026-07-20T22:17:00.000Z"),
    prefs({ enabled: true, quietStart: 21, quietEnd: 8 })
  );
  assert.equal(end.toISOString(), "2026-07-21T08:00:00.000Z");
});

test("resolveDigestPrefs: missing prefs default to opted out", () => {
  assert.equal(resolveDigestPrefs(null).enabled, false);
  assert.equal(resolveDigestPrefs(undefined).enabled, false);
});

// ─── digest payload ──────────────────────────────────────────────────────────

test("buildDigest: a member who opted into nothing gets no payload at all", () => {
  const r = buildDigest(week(7), [], prefs({ enabled: false, inApp: false }), TODAY);
  assert.equal(r.payload, null);
  assert.equal(r.skipped, "not-opted-in");
  assert.equal(r.push, null);
});

test("buildDigest: too few logs this week means nothing to say", () => {
  const r = buildDigest(
    week(MIN_LOGS_FOR_DIGEST - 1),
    [],
    prefs({ enabled: true }),
    TODAY
  );
  assert.equal(r.payload, null);
  assert.equal(r.skipped, "too-few-logs");
});

test("buildDigest: builds a payload once there's a week worth logging", () => {
  const r = buildDigest(week(7), [], prefs({ enabled: true }), TODAY, new Date("2026-07-20T12:00:00.000Z"));
  assert.ok(r.payload);
  assert.equal(r.skipped, null);
  assert.equal(r.payload!.weekEnding, TODAY);
  assert.equal(r.payload!.url, "/insights");
  assert.ok(r.payload!.sections.length >= 1);
  assert.ok(r.payload!.sections.some((s) => s.heading === "Your week"));
  assert.equal(r.push?.send, true);
});

test("buildDigest: in-app-only members still get a payload, but no push", () => {
  const r = buildDigest(
    week(7),
    [],
    prefs({ enabled: false, inApp: true }),
    TODAY,
    new Date("2026-07-20T12:00:00.000Z")
  );
  assert.ok(r.payload, "in-app surfacing doesn't need push consent");
  assert.equal(r.push?.send, false);
  assert.equal(r.push?.send === false && r.push.reason, "not-opted-in");
});

test("buildDigest: a broken streak reports total days, never a bare zero", () => {
  // Logged a week, then nothing for five days — streak is 0.
  const stale = Array.from({ length: 7 }, (_, i) => log(addDays(TODAY, -(11 - i)), 5));
  const recent = week(4);
  const r = buildDigest([...stale, ...recent], [], prefs({ inApp: true }), TODAY);
  assert.ok(r.payload);
  const text = r.payload!.sections.map((s) => `${s.heading} ${s.text}`).join(" ");
  assert.ok(!/\b0 days\b/.test(text), `digest must not say "0 days": ${text}`);
});

test("buildDigest: a surfaced pattern always carries the caveat", () => {
  // 20 days, every third followed by a bad day — enough for the insight engine.
  const logs: DailyLog[] = [];
  const triggers: { date: string; kind: string; name: string }[] = [];
  for (let i = 0; i < 20; i++) {
    const date = addDays(TODAY, -(19 - i));
    logs.push(log(date, i % 3 === 1 ? 8 : 3, 3));
    if (i % 3 === 0) triggers.push({ date, kind: "food", name: "Dairy" });
  }
  const r = buildDigest(logs, triggers, prefs({ enabled: true }), TODAY, new Date("2026-07-20T12:00:00.000Z"));
  assert.ok(r.payload?.insight, "expected a pattern from 20 days of data");
  assert.ok(/pattern, not proof/i.test(r.payload!.body));
});

console.log(`\n${passed} digest tests passed.`);
