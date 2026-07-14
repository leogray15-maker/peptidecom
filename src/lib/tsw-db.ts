import "server-only";
import { adminDb } from "@/lib/firebase-admin";
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
  await ref.set({ recoveryStage: stage, stageUpdatedAt: now }, { merge: true });
  // Append-only stage history — feeds the time-to-stage cohort stats.
  if (prev !== stage) {
    await ref.collection("stageEvents").add({ stage, at: now });
  }
}

export async function setTswStartDate(uid: string, date: string | null): Promise<void> {
  const db = await adminDb();
  await db.collection("users").doc(uid).set({ tswStartDate: date }, { merge: true });
}

export async function setCondition(uid: string, condition: string): Promise<void> {
  const db = await adminDb();
  await db.collection("users").doc(uid).set({ condition }, { merge: true });
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
  await photoRef.update({ shared });

  const mirrorRef = db.collection("sharedPhotos").doc(`${uid}_${photoId}`);
  if (shared) {
    const data = snap.data() as Omit<TswPhoto, "id">;
    await mirrorRef.set({
      uid,
      authorName,
      takenAt: data.takenAt,
      area: data.area ?? null,
      caption: data.caption ?? null,
      imageData: data.imageData,
      sharedAt: new Date().toISOString(),
    });
  } else {
    await mirrorRef.delete();
  }
}

export async function deletePhoto(uid: string, photoId: string): Promise<void> {
  const db = await adminDb();
  await db.collection("users").doc(uid).collection("photos").doc(photoId).delete();
  await db.collection("sharedPhotos").doc(`${uid}_${photoId}`).delete();
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
  const fresh: MilestoneDef[] = [];
  for (const key of earnedKeys) {
    const def = MILESTONE_DEFS[key];
    if (!def || existing.has(key)) continue;
    await col.doc(key).set({ key, achievedAt: new Date().toISOString(), celebrated: false });
    await logFunnel(uid, "milestone_reached", { milestone: key });
    fresh.push(def);
  }
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
  await saveLog(uid, log);
  const [logs, profile] = await Promise.all([listLogs(uid), getProfile(uid)]);
  const stats = computeStats(logs);
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
