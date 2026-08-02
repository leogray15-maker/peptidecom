import "server-only";
import { adminDb } from "@/lib/firebase-admin";
import type { FlareRisk, ForecastLocation, WeatherSnapshot } from "@/lib/forecast";
import {
  type DailyLog,
  type FunnelEvent,
  MILESTONE_DEFS,
  type MilestoneDef,
  computeStats,
  earnedMilestones,
} from "@/lib/tsw";

/** Firestore key for a member: their Firebase UID when linked, else the
 * Postgres user id (covers admin-cookie and preview sessions). */
export function tswKey(user: { id: string; firebaseUid?: string | null }): string {
  return user.firebaseUid ?? user.id;
}

// ─── Profile (users/{uid}) ───────────────────────────────────────────────────

export interface TswProfile {
  recoveryStage?: string | null;
  tswStartDate?: string | null; // YYYY-MM-DD
  stageUpdatedAt?: string | null;
  /** Condition id from lib/conditions.ts. Missing = "tsw" (every account
   * predating multi-condition support) — resolved via getCondition(). */
  condition?: string | null;
  /** Feature switches that used to live in localStorage. Kept on the profile so
   * the choice follows the member to every device they sign in on. Missing =
   * the defaults in lib/consent.ts. */
  consents?: Partial<Record<string, boolean>> | null;
  consentsUpdatedAt?: string | null;
  /** Last place the flare forecast was run for, so a new device opens on the
   * member's location instead of asking again. */
  location?: ForecastLocation | null;
}

export async function getProfile(uid: string): Promise<TswProfile> {
  const db = await adminDb();
  const snap = await db.collection("users").doc(uid).get();
  return (snap.data() as TswProfile | undefined) ?? {};
}

export async function setStage(uid: string, stage: string): Promise<void> {
  const db = await adminDb();
  const ref = db.collection("users").doc(uid);
  const now = new Date().toISOString();
  const prev = ((await ref.get()).data() as TswProfile | undefined)?.recoveryStage ?? null;
  const writes: Promise<unknown>[] = [
    ref.set({ recoveryStage: stage, stageUpdatedAt: now }, { merge: true }),
  ];
  // Append-only stage history — feeds the time-to-stage cohort stats.
  if (prev !== stage) {
    writes.push(ref.collection("stageEvents").add({ stage, at: now }));
  }
  await Promise.all(writes);
}

export async function setTswStartDate(uid: string, date: string | null): Promise<void> {
  const db = await adminDb();
  await db.collection("users").doc(uid).set({ tswStartDate: date }, { merge: true });
}

export async function setCondition(uid: string, condition: string): Promise<void> {
  const db = await adminDb();
  await db.collection("users").doc(uid).set({ condition }, { merge: true });
}

/** Merge feature-consent switches onto the profile. Partial by design: a device
 * only ever sends the switch the member just flipped. */
export async function setConsents(
  uid: string,
  consents: Record<string, boolean>
): Promise<void> {
  const db = await adminDb();
  await db
    .collection("users")
    .doc(uid)
    .set(
      { consents, consentsUpdatedAt: new Date().toISOString() },
      { merge: true }
    );
}

export async function setLocation(uid: string, location: ForecastLocation): Promise<void> {
  const db = await adminDb();
  await db.collection("users").doc(uid).set({ location }, { merge: true });
}

// ─── Daily logs (users/{uid}/dailyLogs/{YYYY-MM-DD}) ─────────────────────────

export async function listLogs(uid: string, sinceDate?: string): Promise<DailyLog[]> {
  const db = await adminDb();
  let q = db
    .collection("users")
    .doc(uid)
    .collection("dailyLogs")
    .orderBy("date", "asc");
  if (sinceDate) q = q.where("date", ">=", sinceDate);
  const snap = await q.get();
  return snap.docs.map((d) => d.data() as DailyLog);
}

export async function saveLog(uid: string, log: DailyLog): Promise<void> {
  const db = await adminDb();
  await db
    .collection("users")
    .doc(uid)
    .collection("dailyLogs")
    .doc(log.date)
    .set({ ...log, updatedAt: new Date().toISOString() });
}

export async function deleteLog(uid: string, date: string): Promise<void> {
  const db = await adminDb();
  await db.collection("users").doc(uid).collection("dailyLogs").doc(date).delete();
}

// ─── Photos (users/{uid}/photos/{id}; shared mirror in sharedPhotos) ─────────

export interface TswPhoto {
  id: string;
  takenAt: string; // YYYY-MM-DD
  area: string | null;
  caption: string | null;
  imageData: string; // compressed data-URL (kept well under the 1MB doc limit)
  shared: boolean;
  createdAt: string;
  /** Free client-side severity estimate (see src/lib/photo-score.ts).
   * Absent on photos uploaded before the feature existed. */
  estimate?: import("@/lib/photo-score").PhotoEstimate | null;
}

export async function listPhotos(uid: string): Promise<TswPhoto[]> {
  const db = await adminDb();
  const snap = await db
    .collection("users")
    .doc(uid)
    .collection("photos")
    .orderBy("takenAt", "asc")
    .get();
  return snap.docs.map((d) => ({ ...(d.data() as Omit<TswPhoto, "id">), id: d.id }));
}

/** Just the date of the most recent photo. Photos carry their image data
 * inline, so anything that only needs "when was the last one?" must not list
 * the collection — this projects a single field off a single doc. */
export async function lastPhotoDate(uid: string): Promise<string | null> {
  const db = await adminDb();
  const snap = await db
    .collection("users")
    .doc(uid)
    .collection("photos")
    .orderBy("takenAt", "desc")
    .limit(1)
    .select("takenAt")
    .get();
  const takenAt = snap.docs[0]?.get("takenAt");
  return typeof takenAt === "string" ? takenAt : null;
}

export async function addPhoto(
  uid: string,
  photo: Omit<TswPhoto, "id" | "createdAt">
): Promise<string> {
  const db = await adminDb();
  const ref = await db
    .collection("users")
    .doc(uid)
    .collection("photos")
    .add({ ...photo, createdAt: new Date().toISOString() });
  return ref.id;
}

/** Toggle community sharing. Shared photos are mirrored to a top-level
 * collection so the "Won" wall can read them without collection-group indexes. */
export async function setPhotoShared(
  uid: string,
  photoId: string,
  shared: boolean,
  authorName: string | null
): Promise<void> {
  const db = await adminDb();
  const photoRef = db.collection("users").doc(uid).collection("photos").doc(photoId);
  const snap = await photoRef.get();
  if (!snap.exists) throw new Error("Photo not found");

  const mirrorRef = db.collection("sharedPhotos").doc(`${uid}_${photoId}`);
  const data = snap.data() as Omit<TswPhoto, "id">;
  await Promise.all([
    photoRef.update({ shared }),
    shared
      ? mirrorRef.set({
          uid,
          authorName,
          takenAt: data.takenAt,
          area: data.area ?? null,
          caption: data.caption ?? null,
          imageData: data.imageData,
          sharedAt: new Date().toISOString(),
        })
      : mirrorRef.delete(),
  ]);
}

export async function deletePhoto(uid: string, photoId: string): Promise<void> {
  const db = await adminDb();
  await Promise.all([
    db.collection("users").doc(uid).collection("photos").doc(photoId).delete(),
    db.collection("sharedPhotos").doc(`${uid}_${photoId}`).delete(),
  ]);
}

export interface SharedPhoto {
  id: string;
  authorName: string | null;
  takenAt: string;
  area: string | null;
  caption: string | null;
  imageData: string;
  sharedAt: string;
}

export async function listSharedPhotos(limit = 12): Promise<SharedPhoto[]> {
  const db = await adminDb();
  const snap = await db
    .collection("sharedPhotos")
    .orderBy("sharedAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ ...(d.data() as Omit<SharedPhoto, "id">), id: d.id }));
}

// ─── Trigger & routine log (users/{uid}/triggerLogs/{id}) ────────────────────

export interface TriggerLog {
  id: string;
  date: string; // YYYY-MM-DD
  kind: string;
  name: string;
  effect: number; // 1 helped · 0 neutral · -1 flared
  note: string | null;
  createdAt: string;
}

export async function listTriggers(uid: string): Promise<TriggerLog[]> {
  const db = await adminDb();
  const snap = await db
    .collection("users")
    .doc(uid)
    .collection("triggerLogs")
    .orderBy("date", "desc")
    .limit(200)
    .get();
  return snap.docs.map((d) => ({ ...(d.data() as Omit<TriggerLog, "id">), id: d.id }));
}

export async function addTrigger(
  uid: string,
  entry: Omit<TriggerLog, "id" | "createdAt">
): Promise<string> {
  const db = await adminDb();
  const ref = await db
    .collection("users")
    .doc(uid)
    .collection("triggerLogs")
    .add({ ...entry, createdAt: new Date().toISOString() });
  return ref.id;
}

export async function deleteTrigger(uid: string, id: string): Promise<void> {
  const db = await adminDb();
  await db.collection("users").doc(uid).collection("triggerLogs").doc(id).delete();
}

// ─── Journal (users/{uid}/journal/{id}) ──────────────────────────────────────
// Goal-agnostic progress journal: how it's going toward whatever the member is
// researching for (skin, muscle, cognition…), with weight as an optional extra.

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  goal: string; // RESEARCH_GOALS id
  rating: number; // 1–10 "how is it going toward this goal"
  weightKg: number | null;
  note: string | null;
  createdAt: string;
}

export async function listJournal(uid: string): Promise<JournalEntry[]> {
  const db = await adminDb();
  const snap = await db
    .collection("users")
    .doc(uid)
    .collection("journal")
    .orderBy("date", "desc")
    .limit(500)
    .get();
  return snap.docs.map((d) => ({ ...(d.data() as Omit<JournalEntry, "id">), id: d.id }));
}

export async function addJournalEntry(
  uid: string,
  entry: Omit<JournalEntry, "id" | "createdAt">
): Promise<string> {
  const db = await adminDb();
  const ref = await db
    .collection("users")
    .doc(uid)
    .collection("journal")
    .add({ ...entry, createdAt: new Date().toISOString() });
  return ref.id;
}

export async function deleteJournalEntry(uid: string, id: string): Promise<void> {
  const db = await adminDb();
  await db.collection("users").doc(uid).collection("journal").doc(id).delete();
}

// ─── Peptide log (users/{uid}/peptideLogs/{id}) ──────────────────────────────

export interface PeptideLog {
  id: string;
  date: string; // YYYY-MM-DD
  peptide: string;
  doseMg: number;
  purpose: string | null; // RESEARCH_GOALS id
  note: string | null;
  createdAt: string;
  /** Injection site id (lib/peptides.ts INJECTION_SITES) — rotation tracking.
   * Absent on logs from before the feature existed. */
  site?: string | null;
}

export async function listPeptideLogs(uid: string): Promise<PeptideLog[]> {
  const db = await adminDb();
  const snap = await db
    .collection("users")
    .doc(uid)
    .collection("peptideLogs")
    .orderBy("date", "desc")
    .limit(500)
    .get();
  return snap.docs.map((d) => ({ ...(d.data() as Omit<PeptideLog, "id">), id: d.id }));
}

export async function addPeptideLog(
  uid: string,
  entry: Omit<PeptideLog, "id" | "createdAt">
): Promise<string> {
  const db = await adminDb();
  const ref = await db
    .collection("users")
    .doc(uid)
    .collection("peptideLogs")
    .add({ ...entry, createdAt: new Date().toISOString() });
  return ref.id;
}

export async function deletePeptideLog(uid: string, id: string): Promise<void> {
  const db = await adminDb();
  await db.collection("users").doc(uid).collection("peptideLogs").doc(id).delete();
}

// ─── Dose protocols (users/{uid}/peptideProtocols/{id}) ─────────────────────
// Schedules ("BPC-157, 0.5 mg, daily") that drive the tracker's Today view.
// The shape lives in lib/protocol-schedule.ts so client code can share it.

import type { PeptideProtocol } from "@/lib/protocol-schedule";

export async function listProtocols(uid: string): Promise<PeptideProtocol[]> {
  const db = await adminDb();
  const snap = await db
    .collection("users")
    .doc(uid)
    .collection("peptideProtocols")
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((d) => ({ ...(d.data() as Omit<PeptideProtocol, "id">), id: d.id }));
}

export async function addProtocol(
  uid: string,
  protocol: Omit<PeptideProtocol, "id" | "createdAt">
): Promise<string> {
  const db = await adminDb();
  const ref = await db
    .collection("users")
    .doc(uid)
    .collection("peptideProtocols")
    .add({ ...protocol, createdAt: new Date().toISOString() });
  return ref.id;
}

export async function setProtocolActive(uid: string, id: string, active: boolean): Promise<void> {
  const db = await adminDb();
  await db
    .collection("users")
    .doc(uid)
    .collection("peptideProtocols")
    .doc(id)
    .set({ active }, { merge: true });
}

export async function deleteProtocol(uid: string, id: string): Promise<void> {
  const db = await adminDb();
  await db.collection("users").doc(uid).collection("peptideProtocols").doc(id).delete();
}

// ─── Milestones (users/{uid}/milestones/{key}) ───────────────────────────────

export interface MilestoneRecord {
  key: string;
  achievedAt: string;
  celebrated: boolean;
}

export async function getMilestones(uid: string): Promise<MilestoneRecord[]> {
  const db = await adminDb();
  const snap = await db.collection("users").doc(uid).collection("milestones").get();
  return snap.docs.map((d) => d.data() as MilestoneRecord);
}

/** Award any newly-earned milestones. Returns the defs of milestones that were
 * just created (so the UI can run the celebration screen), and instruments
 * each one as a funnel event. */
export async function awardNewMilestones(
  uid: string,
  earnedKeys: string[]
): Promise<MilestoneDef[]> {
  const db = await adminDb();
  const col = db.collection("users").doc(uid).collection("milestones");
  const existing = new Set((await col.get()).docs.map((d) => d.id));
  const fresh = earnedKeys
    .filter((key) => MILESTONE_DEFS[key] && !existing.has(key))
    .map((key) => MILESTONE_DEFS[key]);
  // Independent docs — write them (and their funnel events) in parallel.
  await Promise.all(
    fresh.flatMap((def) => [
      col.doc(def.key).set({ key: def.key, achievedAt: new Date().toISOString(), celebrated: false }),
      logFunnel(uid, "milestone_reached", { milestone: def.key }),
    ])
  );
  return fresh;
}

export async function markMilestoneCelebrated(uid: string, key: string): Promise<void> {
  const db = await adminDb();
  await db
    .collection("users")
    .doc(uid)
    .collection("milestones")
    .doc(key)
    .set({ celebrated: true }, { merge: true });
  await logFunnel(uid, "milestone_celebrated", { milestone: key });
}

/** Save a daily log, then recompute stats and award anything newly earned.
 * One round trip for the tracker's save endpoint. */
export async function saveLogAndAward(
  uid: string,
  log: DailyLog
): Promise<{ newMilestones: MilestoneDef[] }> {
  // The save and the reads are independent: merge the fresh log into the
  // listed set in memory, so stats are correct regardless of read timing and
  // the collection isn't re-read after the write.
  const [, logs, profile] = await Promise.all([
    saveLog(uid, log),
    listLogs(uid),
    getProfile(uid),
  ]);
  const merged = [...logs.filter((l) => l.date !== log.date), log];
  const stats = computeStats(merged);
  const newMilestones = await awardNewMilestones(
    uid,
    earnedMilestones(stats, profile.recoveryStage)
  );
  return { newMilestones };
}

// ─── Recovery stories (recoveryStories/{id}) ─────────────────────────────────

/** Admin triage pipeline for the content flywheel. Stories from before this
 * existed have no status — treat missing as "new". */
export type StoryStatus = "new" | "approved" | "posted" | "skipped";

export interface StoryPrompts {
  hardest?: string | null; // "What was the hardest part?"
  changed?: string | null; // "What changed?"
  advice?: string | null; // "What would you tell someone at the start?"
}

export interface RecoveryStory {
  id: string;
  uid: string;
  authorName: string | null;
  title: string;
  body: string;
  monthsIn: number | null;
  createdAt: string;
  /** Condition id; stories from before multi-condition are TSW (missing). */
  condition?: string | null;
  /** Guided-prompt answers (optional, shown as Q&A on the wall). */
  prompts?: StoryPrompts | null;
  /** Explicit, opt-in marketing consent. Missing (pre-flywheel stories) or
   * false = the story may ONLY appear on the members-only wall. */
  marketingConsent?: boolean;
  marketingConsentAt?: string | null;
  /** Separate opt-in for before/after photos in marketing content. */
  photoConsent?: boolean;
  beforePhotoId?: string | null;
  afterPhotoId?: string | null;
  status?: StoryStatus;
  statusUpdatedAt?: string | null;
  postedAt?: string | null;
}

export async function listStories(limit = 50): Promise<RecoveryStory[]> {
  const db = await adminDb();
  const snap = await db
    .collection("recoveryStories")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ ...(d.data() as Omit<RecoveryStory, "id">), id: d.id }));
}

export async function addStory(
  uid: string,
  story: Omit<RecoveryStory, "id" | "uid" | "createdAt">
): Promise<string> {
  const db = await adminDb();
  const ref = await db
    .collection("recoveryStories")
    .add({ ...story, uid, createdAt: new Date().toISOString() });
  return ref.id;
}

export async function setStoryStatus(id: string, status: StoryStatus): Promise<void> {
  const db = await adminDb();
  const now = new Date().toISOString();
  await db
    .collection("recoveryStories")
    .doc(id)
    .set(
      { status, statusUpdatedAt: now, ...(status === "posted" ? { postedAt: now } : {}) },
      { merge: true }
    );
}

/** Fetch specific photos of a member by id (admin quote-card generation —
 * only ever called for photos the member explicitly consented to). */
export async function getPhotosByIds(uid: string, ids: string[]): Promise<TswPhoto[]> {
  const db = await adminDb();
  const snaps = await Promise.all(
    ids.map((id) => db.collection("users").doc(uid).collection("photos").doc(id).get())
  );
  return snaps
    .filter((s) => s.exists)
    .map((s) => ({ ...(s.data() as Omit<TswPhoto, "id">), id: s.id }));
}

// ─── Tool history (users/{uid}/history/{key}) ────────────────────────────────
// EASI / POEM scores and the product-scanner history. These used to live in
// localStorage only, which meant a member's own numbers vanished when they
// switched phone. They now live on the account; the client keeps a local copy
// as an offline cache and reconciles on load (see lib/synced-store.ts).
//
// Every entry carries an ISO `at` timestamp, which doubles as its identity —
// merging two devices' lists is a union keyed on `at`, so the same save
// arriving twice can never duplicate.

export interface StoredHistoryEntry {
  at: string;
  score: number;
  detail: unknown;
}

/** How many entries each history key keeps. Oldest are dropped first. */
export const HISTORY_LIMITS: Record<string, number> = {
  easi: 60,
  poem: 60,
  scans: 100,
};

export const HISTORY_KEYS = Object.keys(HISTORY_LIMITS);

export async function getHistory(uid: string, key: string): Promise<StoredHistoryEntry[]> {
  const db = await adminDb();
  const snap = await db.collection("users").doc(uid).collection("history").doc(key).get();
  const entries = (snap.data() as { entries?: StoredHistoryEntry[] } | undefined)?.entries;
  return Array.isArray(entries) ? entries : [];
}

/** Merge incoming entries into the stored list (union by `at`, oldest dropped
 * past the key's limit) and return the reconciled list the client should adopt.
 * Idempotent, so a retry after a flaky connection is always safe. */
export async function mergeHistory(
  uid: string,
  key: string,
  incoming: StoredHistoryEntry[]
): Promise<StoredHistoryEntry[]> {
  const db = await adminDb();
  const ref = db.collection("users").doc(uid).collection("history").doc(key);
  const existing = await getHistory(uid, key);

  const byAt = new Map<string, StoredHistoryEntry>();
  for (const entry of [...existing, ...incoming]) {
    if (entry && typeof entry.at === "string") byAt.set(entry.at, entry);
  }
  const merged = [...byAt.values()]
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(-(HISTORY_LIMITS[key] ?? 60));

  await ref.set({ entries: merged, updatedAt: new Date().toISOString() });
  return merged;
}

export async function clearHistoryKey(uid: string, key: string): Promise<void> {
  const db = await adminDb();
  await db
    .collection("users")
    .doc(uid)
    .collection("history")
    .doc(key)
    .set({ entries: [], updatedAt: new Date().toISOString() });
}

/** Every history key at once — one round trip for the first paint. */
export async function getAllHistory(
  uid: string
): Promise<Record<string, StoredHistoryEntry[]>> {
  const lists = await Promise.all(HISTORY_KEYS.map((key) => getHistory(uid, key)));
  return Object.fromEntries(HISTORY_KEYS.map((key, i) => [key, lists[i]]));
}

// ─── Itch check-ins (users/{uid}/itchLogs/{id}) ──────────────────────────────
// Deliberately lighter than the daily tracker: one tap on a 0–10 scale, as
// many times a day as the itch demands. The daily log stays the considered
// record; these are the in-the-moment ones that show when itch actually peaks.

export interface ItchLog {
  id: string;
  date: string; // YYYY-MM-DD (local to the member's device)
  at: string; // ISO timestamp
  level: number; // 0–10
  /** What they were doing / what set it off — free text, optional. */
  note: string | null;
  /** What helped, from lib/tsw.ts ITCH_ACTIONS. Optional. */
  action: string | null;
}

export async function listItchLogs(uid: string, limit = 300): Promise<ItchLog[]> {
  const db = await adminDb();
  const snap = await db
    .collection("users")
    .doc(uid)
    .collection("itchLogs")
    .orderBy("at", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ ...(d.data() as Omit<ItchLog, "id">), id: d.id }));
}

export async function addItchLog(
  uid: string,
  entry: Omit<ItchLog, "id">
): Promise<string> {
  const db = await adminDb();
  const ref = await db.collection("users").doc(uid).collection("itchLogs").add(entry);
  return ref.id;
}

export async function deleteItchLog(uid: string, id: string): Promise<void> {
  const db = await adminDb();
  await db.collection("users").doc(uid).collection("itchLogs").doc(id).delete();
}

// ─── Saved forecasts (users/{uid}/forecasts/{YYYY-MM-DD}) ────────────────────
// One snapshot per day, so "what was the weather doing the week my skin went
// sideways?" is answerable later from the member's own history.

export interface SavedForecast {
  date: string; // YYYY-MM-DD (doc id)
  score: number;
  band: string;
  tone: string;
  factors: string[];
  weather: WeatherSnapshot;
  place: string | null;
  savedAt: string;
}

export async function listForecasts(uid: string, limit = 30): Promise<SavedForecast[]> {
  const db = await adminDb();
  const snap = await db
    .collection("users")
    .doc(uid)
    .collection("forecasts")
    .orderBy("date", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => d.data() as SavedForecast);
}

export async function getForecast(uid: string, date: string): Promise<SavedForecast | null> {
  const db = await adminDb();
  const snap = await db.collection("users").doc(uid).collection("forecasts").doc(date).get();
  return snap.exists ? (snap.data() as SavedForecast) : null;
}

export async function saveForecast(
  uid: string,
  date: string,
  risk: FlareRisk,
  weather: WeatherSnapshot,
  place: string | null
): Promise<void> {
  const db = await adminDb();
  await db
    .collection("users")
    .doc(uid)
    .collection("forecasts")
    .doc(date)
    .set({
      date,
      score: risk.score,
      band: risk.band,
      tone: risk.tone,
      factors: risk.factors.map((f) => f.label),
      weather,
      place,
      savedAt: new Date().toISOString(),
    } satisfies SavedForecast);
}

// ─── Funnel instrumentation (funnelEvents/{id}) ──────────────────────────────

export async function logFunnel(
  uid: string,
  event: FunnelEvent,
  meta?: Record<string, unknown>
): Promise<void> {
  try {
    const db = await adminDb();
    await db.collection("funnelEvents").add({
      uid,
      event,
      meta: meta ?? null,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    // Instrumentation must never break the product.
    console.error("logFunnel failed:", err);
  }
}
