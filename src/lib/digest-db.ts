import "server-only";
import { adminDb } from "@/lib/firebase-admin";
import { type DigestPayload, buildDigest } from "@/lib/digest";
import type { TriggerLike } from "@/lib/insights";
import { type DailyLog, dateKey } from "@/lib/tsw";
import type { TswProfile } from "@/lib/tsw-db";

// The weekly digest run (Vercel Cron → /api/cron/digest, see vercel.json).
// Mirrors the nightly aggregation's shape: chunked per-user reads, everything
// best-effort, one summary returned.
//
// Payloads are written to users/{uid}/digests/{weekEnding} for in-app
// surfacing. NOTHING IS PUSHED — no transport exists yet. `pushQueued` counts
// the members a transport *would* be handed, and `pushDeferred` the ones whose
// quiet hours haven't finished.

const CONCURRENCY = 10;

export interface DigestRunSummary {
  usersScanned: number;
  digestsGenerated: number;
  pushQueued: number;
  pushDeferred: number;
  skippedNotOptedIn: number;
  skippedTooFewLogs: number;
  weekEnding: string;
}

export async function runDigest(today = dateKey()): Promise<DigestRunSummary> {
  const db = await adminDb();
  const userRefs = await db.collection("users").listDocuments();
  const now = new Date();

  const summary: DigestRunSummary = {
    usersScanned: userRefs.length,
    digestsGenerated: 0,
    pushQueued: 0,
    pushDeferred: 0,
    skippedNotOptedIn: 0,
    skippedTooFewLogs: 0,
    weekEnding: today,
  };

  for (let i = 0; i < userRefs.length; i += CONCURRENCY) {
    const chunk = userRefs.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      chunk.map(async (ref) => {
        const profile = ((await ref.get()).data() as TswProfile | undefined) ?? {};

        // Cheapest possible exit: a member who hasn't opted in to anything is
        // never read further, so the job costs nothing for most accounts.
        const prefs = profile.digestPrefs;
        if (!prefs?.enabled && !prefs?.inApp) return { skipped: "not-opted-in" as const };

        const [logsSnap, triggersSnap] = await Promise.all([
          ref.collection("dailyLogs").orderBy("date", "asc").get(),
          ref.collection("triggerLogs").get(),
        ]);
        const logs = logsSnap.docs.map((d) => d.data() as DailyLog);
        const triggers = triggersSnap.docs.map((d) => {
          const t = d.data() as TriggerLike;
          return { date: t.date, kind: t.kind, name: t.name };
        });

        const result = buildDigest(logs, triggers, prefs, today, now);
        if (!result.payload) return { skipped: result.skipped };

        await ref.collection("digests").doc(today).set({
          ...result.payload,
          generatedAt: now.toISOString(),
          // Recorded so a future transport knows what it still owes this
          // member, and so quiet-hours deferrals are auditable.
          pushState: result.push?.send
            ? "ready"
            : result.push?.reason === "quiet-hours"
              ? "deferred"
              : "in-app-only",
          pushDeferredUntil:
            result.push && !result.push.send && result.push.reason === "quiet-hours"
              ? result.push.deferUntil.toISOString()
              : null,
        });

        return { skipped: null, push: result.push };
      })
    );

    for (const r of results) {
      if (r.skipped === "not-opted-in") summary.skippedNotOptedIn++;
      else if (r.skipped === "too-few-logs") summary.skippedTooFewLogs++;
      else {
        summary.digestsGenerated++;
        if (r.push?.send) summary.pushQueued++;
        else if (r.push && r.push.reason === "quiet-hours") summary.pushDeferred++;
      }
    }
  }

  return summary;
}

/** The member's latest digest, for in-app surfacing. */
export async function getLatestDigest(uid: string): Promise<DigestPayload | null> {
  const db = await adminDb();
  const snap = await db
    .collection("users")
    .doc(uid)
    .collection("digests")
    .orderBy("weekEnding", "desc")
    .limit(1)
    .get();
  return (snap.docs[0]?.data() as DigestPayload | undefined) ?? null;
}
