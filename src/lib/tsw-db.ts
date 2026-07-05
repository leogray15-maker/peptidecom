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
}

export async function getProfile(uid: string): Promise<TswProfile> {
  const db = await adminDb();
  const snap = await db.collection("users").doc(uid).get();
  return (snap.data() as TswProfile | undefined) ?? {};
}

export async function setStage(uid: string, stage: string): Promise<void> {
  const db = await adminDb();
  await db
    .collection("users")
    .doc(uid)
    .set({ recoveryStage: stage, stageUpdatedAt: new Date().toISOString() }, { merge: true });
}

export async function setTswStartDate(uid: string, date: string | null): Promise<void> {
  const db = await adminDb();
  await db.collection("users").doc(uid).set({ tswStartDate: date }, { merge: true });
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

export interface RecoveryStory {
  id: string;
  uid: string;
  authorName: string | null;
  title: string;
  body: string;
  monthsIn: number | null;
  createdAt: string;
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
