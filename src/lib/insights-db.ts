import "server-only";
import { adminDb } from "@/lib/firebase-admin";
import type { DailyLog } from "@/lib/tsw";
import type { TswProfile } from "@/lib/tsw-db";
import {
  type CohortAggregates,
  type StageEvent,
  type TriggerLike,
  type UserFeatures,
  aggregateCohort,
  computeUserFeatures,
} from "@/lib/insights";

// The nightly aggregation run (triggered by Vercel Cron via
// /api/cron/aggregate — see vercel.json). Reads every user's raw tracking
// data server-side, reduces each user to anonymous UserFeatures in memory,
// and persists ONLY the cohort-level result to insights_aggregates/latest.
//
// Privacy invariants (please keep them true):
//  - No uid, email, name, note text, or per-user series is ever written to
//    insights_aggregates. `computeUserFeatures` receives no identity fields.
//  - Every persisted stat already satisfies MIN_COHORT (enforced inside
//    aggregateCohort), so nothing traceable to a small group is stored.
//
// Cost notes: one pass per user per night, subcollections read with plain
// per-user queries (no collection-group scans, no new indexes needed).
// Dashboards then read a single doc. If user counts grow to where the
// nightly full read matters, switch to incremental aggregation on
// dailyLogs.updatedAt before reaching for anything paid.

const AGGREGATES_DOC = "latest";
const CONCURRENCY = 10;

export interface AggregationRunSummary {
  usersScanned: number;
  usersContributing: number;
  stageEventsSeeded: number;
  generatedAt: string;
}

export async function runAggregation(): Promise<AggregationRunSummary> {
  const db = await adminDb();

  // listDocuments() (not .get()) so users whose profile doc was never created
  // — subcollection writes alone don't create the parent — are still included.
  const userRefs = await db.collection("users").listDocuments();

  const features: UserFeatures[] = [];
  let stageEventsSeeded = 0;

  for (let i = 0; i < userRefs.length; i += CONCURRENCY) {
    const chunk = userRefs.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      chunk.map(async (ref) => {
        const [profileSnap, logsSnap, triggersSnap, stageEventsSnap] = await Promise.all([
          ref.get(),
          ref.collection("dailyLogs").orderBy("date", "asc").get(),
          ref.collection("triggerLogs").get(),
          ref.collection("stageEvents").orderBy("at", "asc").get(),
        ]);
        const profile = (profileSnap.data() as TswProfile | undefined) ?? {};
        const logs = logsSnap.docs.map((d) => d.data() as DailyLog);
        const triggers = triggersSnap.docs.map((d) => {
          const t = d.data() as { date: string; kind: string; name: string };
          return { date: t.date, kind: t.kind, name: t.name } satisfies TriggerLike;
        });
        let stageEvents = stageEventsSnap.docs.map((d) => d.data() as StageEvent);

        // Lazy one-time seed: users who marked a stage before stage history
        // existed get their current (stage, stageUpdatedAt) as the first
        // event. Additive only — nothing is modified or deleted.
        let seeded = false;
        if (stageEvents.length === 0 && profile.recoveryStage) {
          const event: StageEvent = {
            stage: profile.recoveryStage,
            at: profile.stageUpdatedAt ?? new Date().toISOString(),
          };
          await ref.collection("stageEvents").add({ ...event, seeded: true });
          stageEvents = [event];
          seeded = true;
        }

        return { feature: computeUserFeatures(logs, triggers, profile, stageEvents), seeded };
      })
    );
    for (const r of results) {
      if (r.seeded) stageEventsSeeded++;
      if (r.feature) features.push(r.feature);
    }
  }

  const aggregates = aggregateCohort(features);
  await db.collection("insights_aggregates").doc(AGGREGATES_DOC).set(aggregates);

  return {
    usersScanned: userRefs.length,
    usersContributing: features.length,
    stageEventsSeeded,
    generatedAt: aggregates.generatedAt,
  };
}

/** One-doc read for the dashboard. Null until the first run has happened. */
export async function getLatestAggregates(): Promise<CohortAggregates | null> {
  const db = await adminDb();
  const snap = await db.collection("insights_aggregates").doc(AGGREGATES_DOC).get();
  return (snap.data() as CohortAggregates | undefined) ?? null;
}
