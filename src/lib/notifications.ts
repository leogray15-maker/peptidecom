// Notification preferences and quiet-hours maths.
//
// Safe to import from both server and client code (no server-only deps).
//
// Policy: this is a health app, so every push is strictly opt-in. A member who
// has never opted in is not merely "muted" — the digest job skips them
// entirely and no payload is generated for them. Quiet hours then defer the
// delivery of an already-consented push rather than dropping it.
//
// DELIVERY INFRA IS NOT WIRED. There is no web-push/FCM/email sender in this
// repo (see docs/digest-delivery.md). Everything here decides *whether and
// when* a member may be pushed; handing the payload to a transport is a
// separate task.

export interface DigestPrefs {
  /** Explicit opt-in. False/missing = never generate or send anything. */
  enabled: boolean;
  /** ISO timestamp of the opt-in action, for auditability. */
  optedInAt: string | null;
  /** Local hour (0–23) quiet hours begin. */
  quietStart: number;
  /** Local hour (0–23) quiet hours end. May be lower than quietStart —
   * overnight windows wrap around midnight. */
  quietEnd: number;
  /** Minutes to ADD to UTC to get the member's local time (e.g. +60 for CET,
   * -300 for EST). Captured from the browser at opt-in. */
  utcOffsetMinutes: number;
  /** In-app surfacing of the digest, which is not a push and so is allowed
   * even when push is off — the member sees it when they open the app. */
  inApp: boolean;
}

export const DEFAULT_DIGEST_PREFS: DigestPrefs = {
  enabled: false,
  optedInAt: null,
  quietStart: 21,
  quietEnd: 8,
  utcOffsetMinutes: 0,
  inApp: true,
};

export function resolveDigestPrefs(prefs?: DigestPrefs | null): DigestPrefs {
  return { ...DEFAULT_DIGEST_PREFS, ...(prefs ?? {}) };
}

/** The member's local hour (0–23) for a given instant. */
export function localHour(at: Date, utcOffsetMinutes: number): number {
  const shifted = at.getTime() + utcOffsetMinutes * 60_000;
  return Math.floor(shifted / 3_600_000) % 24;
}

/** Whether a local hour falls inside the quiet window. Handles the overnight
 * wrap (21→8) as well as same-day windows (13→14). An empty window
 * (start === end) means "no quiet hours". */
export function isQuietHour(hour: number, quietStart: number, quietEnd: number): boolean {
  if (quietStart === quietEnd) return false;
  if (quietStart < quietEnd) return hour >= quietStart && hour < quietEnd;
  return hour >= quietStart || hour < quietEnd; // wraps midnight
}

export type PushDecision =
  | { send: true }
  | { send: false; reason: "not-opted-in" }
  | { send: false; reason: "quiet-hours"; deferUntil: Date };

/** May we push this member right now? Opt-in is checked first: a member who
 * never opted in is never deferred, they're simply excluded. */
export function pushDecision(prefs: DigestPrefs, now: Date): PushDecision {
  if (!prefs.enabled) return { send: false, reason: "not-opted-in" };
  const hour = localHour(now, prefs.utcOffsetMinutes);
  if (!isQuietHour(hour, prefs.quietStart, prefs.quietEnd)) return { send: true };
  return { send: false, reason: "quiet-hours", deferUntil: quietWindowEnd(now, prefs) };
}

/** The next instant at which quiet hours are over for this member. */
export function quietWindowEnd(now: Date, prefs: DigestPrefs): Date {
  const hour = localHour(now, prefs.utcOffsetMinutes);
  let hoursAhead = prefs.quietEnd - hour;
  if (hoursAhead <= 0) hoursAhead += 24;
  // Snap to the top of the hour quiet hours end on, in the member's local time.
  const localMs = now.getTime() + prefs.utcOffsetMinutes * 60_000;
  const topOfHour = Math.floor(localMs / 3_600_000) * 3_600_000;
  return new Date(topOfHour + hoursAhead * 3_600_000 - prefs.utcOffsetMinutes * 60_000);
}
