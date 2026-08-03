import "server-only";
import type { DocumentReference, Firestore } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import {
  MAX_PROOF_IMAGES,
  type ProofImage,
  type ProofRecord,
  type ProofSource,
  defaultPublished,
  proofRecordId,
  publishBlocker,
} from "@/lib/proof";

/** Firestore layer for the proof wall.
 *
 * `proofItems/{id}` holds one entry's controls (and, for custom entries, its
 * words). Photos live in `proofItems/{id}/images/{imageId}` — a document each,
 * because a single compressed data-URL already eats a large share of
 * Firestore's 1MB per-document limit and an entry can carry six.
 *
 * Everything here goes through the Admin SDK, so no client rules apply and the
 * collection stays deny-by-default to browsers (see firestore.rules). */

const COLLECTION = "proofItems";

/** Thrown when an action would publish something without a consent record.
 * Callers turn this into a 400 — it's a refusal, not a fault. */
export class ProofConsentError extends Error {}

interface StoredRecord {
  source: ProofSource;
  sourceId: string | null;
  name?: string | null;
  condition?: string | null;
  highlight?: string | null;
  quote?: string | null;
  timeframe?: string | null;
  consentedAt?: string | null;
  consentNote?: string | null;
  published?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string | null;
}

function hydrate(id: string, data: StoredRecord, images: ProofImage[]): ProofRecord {
  return {
    id,
    source: data.source,
    sourceId: data.sourceId ?? null,
    name: data.name ?? null,
    condition: data.condition ?? null,
    highlight: data.highlight ?? null,
    quote: data.quote ?? null,
    timeframe: data.timeframe ?? null,
    consentedAt: data.consentedAt ?? null,
    consentNote: data.consentNote ?? null,
    published: data.published ?? defaultPublished(data.source),
    order: typeof data.order === "number" ? data.order : 0,
    images,
    createdAt: data.createdAt ?? new Date(0).toISOString(),
    updatedAt: data.updatedAt ?? data.createdAt ?? new Date(0).toISOString(),
    updatedBy: data.updatedBy ?? null,
  };
}

async function readImages(doc: DocumentReference): Promise<ProofImage[]> {
  const snap = await doc.collection("images").orderBy("order", "asc").get();
  return snap.docs.map((d) => {
    const data = d.data() as Omit<ProofImage, "id">;
    return {
      id: d.id,
      src: data.src,
      alt: data.alt,
      caption: data.caption ?? null,
      kind: data.kind === "screenshot" ? "screenshot" : "photo",
      order: typeof data.order === "number" ? data.order : 0,
      createdAt: data.createdAt,
    };
  });
}

/** Every entry the CRM holds, **without** photos — one read, and small enough
 * that the wall never needs paging. Photos are data-URLs measured in hundreds
 * of kilobytes, so they're fetched separately by whoever actually renders
 * them: see `withProofImages`. */
export async function listProofRecords(): Promise<ProofRecord[]> {
  const db = await adminDb();
  const snap = await db.collection(COLLECTION).get();
  return snap.docs.map((d) => hydrate(d.id, d.data() as StoredRecord, []));
}

/** Fill in the photos for the entries that are actually going to be rendered.
 * The landing page shows three of them — loading every entry's images to draw
 * three would be most of a megabyte wasted per request. */
export async function withProofImages(records: ProofRecord[]): Promise<ProofRecord[]> {
  const db = await adminDb();
  return Promise.all(
    records.map(async (record) => ({
      ...record,
      images: await readImages(db.collection(COLLECTION).doc(record.id)),
    }))
  );
}

export async function getProofRecord(id: string): Promise<ProofRecord | null> {
  const db = await adminDb();
  const ref = db.collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return hydrate(snap.id, snap.data() as StoredRecord, await readImages(ref));
}

/** Next free sort position — new entries land at the end of the wall. */
async function nextOrder(db: Firestore): Promise<number> {
  const snap = await db.collection(COLLECTION).orderBy("order", "desc").limit(1).get();
  const top = snap.docs[0]?.get("order");
  return typeof top === "number" ? top + 1 : 0;
}

export interface ProofContentInput {
  name: string;
  condition: string;
  quote: string;
  highlight?: string | null;
  timeframe?: string | null;
  consentedAt?: string | null;
  consentNote?: string | null;
}

/** Create a custom entry. Always starts unpublished: putting something on the
 * public site is a separate, deliberate approval. */
export async function createProofRecord(
  input: ProofContentInput,
  actorEmail: string
): Promise<string> {
  const db = await adminDb();
  const now = new Date().toISOString();
  const ref = await db.collection(COLLECTION).add({
    source: "custom",
    sourceId: null,
    name: input.name,
    condition: input.condition,
    quote: input.quote,
    highlight: input.highlight?.trim() || input.quote,
    timeframe: input.timeframe ?? null,
    consentedAt: input.consentedAt ?? null,
    consentNote: input.consentNote ?? null,
    published: false,
    order: await nextOrder(db),
    createdAt: now,
    updatedAt: now,
    updatedBy: actorEmail,
  } satisfies StoredRecord);
  return ref.id;
}

export interface ProofPatch {
  name?: string;
  condition?: string;
  quote?: string;
  highlight?: string | null;
  timeframe?: string | null;
  consentedAt?: string | null;
  consentNote?: string | null;
  published?: boolean;
}

/** Where an overlay comes from, for the write-on-first-touch path. A curated
 * or story entry has no document until the admin acts on it. */
export interface OverlaySeed {
  source: ProofSource;
  sourceId: string;
}

/** Update an entry, creating the overlay document on first touch.
 *
 * Refuses to publish a custom entry with no consent date — the panel hides the
 * button too, and this is the backstop that means a bug or a hand-rolled
 * request can't put unconsented words on the public site. */
export async function updateProofRecord(
  id: string,
  patch: ProofPatch,
  actorEmail: string,
  seed?: OverlaySeed
): Promise<ProofRecord> {
  const db = await adminDb();
  const ref = db.collection(COLLECTION).doc(id);
  const snap = await ref.get();
  const existing = snap.exists ? (snap.data() as StoredRecord) : null;

  if (!existing && !seed) throw new Error("Proof entry not found");
  const source = existing?.source ?? seed!.source;

  if (patch.published === true) {
    const blocker = publishBlocker({
      source,
      name: patch.name ?? existing?.name ?? null,
      quote: patch.quote ?? existing?.quote ?? null,
      consentedAt: patch.consentedAt ?? existing?.consentedAt ?? null,
    });
    if (blocker) throw new ProofConsentError(blocker);
  }

  const now = new Date().toISOString();
  const write: StoredRecord = {
    source,
    sourceId: existing?.sourceId ?? seed?.sourceId ?? null,
    ...(existing ? {} : { published: defaultPublished(source), order: await nextOrder(db) }),
    ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)),
    ...(existing ? {} : { createdAt: now }),
    updatedAt: now,
    updatedBy: actorEmail,
  };

  // Anything being put (back) on the site joins the end of the wall. Keeping a
  // stale position would let a re-approved entry reappear in the lead slot,
  // which is a surprising thing for an approval to do.
  const wasPublished = existing ? (existing.published ?? defaultPublished(source)) : false;
  if (patch.published === true && !wasPublished) write.order = await nextOrder(db);

  await ref.set(write, { merge: true });

  return (await getProofRecord(id))!;
}

/** Rewrite the whole wall's sort order in one pass, creating overlays for any
 * entry the CRM hasn't touched before. Positions are absolute (0…n-1), so the
 * order the admin sees is the order the site renders — no fractional drift. */
export async function reorderProofRecords(
  entries: OverlaySeed[],
  actorEmail: string
): Promise<void> {
  const db = await adminDb();
  const now = new Date().toISOString();
  await Promise.all(
    entries.map(async ({ source, sourceId }, index) => {
      const id = proofRecordId(source, sourceId);
      const ref = db.collection(COLLECTION).doc(id);
      const exists = (await ref.get()).exists;
      const write: StoredRecord = {
        source,
        sourceId: source === "custom" ? null : sourceId,
        order: index,
        updatedAt: now,
        updatedBy: actorEmail,
      };
      if (!exists) {
        write.published = defaultPublished(source);
        write.createdAt = now;
      }
      await ref.set(write, { merge: true });
    })
  );
}

/** Delete a custom entry (or drop an overlay back to its defaults), photos
 * and all. */
export async function deleteProofRecord(id: string): Promise<void> {
  const db = await adminDb();
  const ref = db.collection(COLLECTION).doc(id);
  const images = await ref.collection("images").get();
  await Promise.all(images.docs.map((d) => d.ref.delete()));
  await ref.delete();
}

export interface ProofImageInput {
  src: string;
  alt: string;
  caption?: string | null;
  kind?: "photo" | "screenshot";
}

/** Attach a photo. Overlay documents are created on first upload, which is how
 * a curated entry whose image files were never dropped into /public gets real
 * pictures without a deploy. */
export async function addProofImage(
  id: string,
  image: ProofImageInput,
  actorEmail: string,
  seed?: OverlaySeed
): Promise<string> {
  const db = await adminDb();
  const ref = db.collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    if (!seed) throw new Error("Proof entry not found");
    const now = new Date().toISOString();
    await ref.set({
      source: seed.source,
      sourceId: seed.source === "custom" ? null : seed.sourceId,
      published: defaultPublished(seed.source),
      order: await nextOrder(db),
      createdAt: now,
      updatedAt: now,
      updatedBy: actorEmail,
    } satisfies StoredRecord);
  }

  const existing = await ref.collection("images").get();
  if (existing.size >= MAX_PROOF_IMAGES) {
    throw new ProofConsentError(
      `That's the limit of ${MAX_PROOF_IMAGES} photos on one entry — remove one first.`
    );
  }
  const order = Math.max(-1, ...existing.docs.map((d) => (d.get("order") as number) ?? 0)) + 1;

  const added = await ref.collection("images").add({
    src: image.src,
    alt: image.alt,
    caption: image.caption ?? null,
    kind: image.kind ?? "photo",
    order,
    createdAt: new Date().toISOString(),
  });
  await ref.set({ updatedAt: new Date().toISOString(), updatedBy: actorEmail }, { merge: true });
  return added.id;
}

export async function deleteProofImage(id: string, imageId: string): Promise<void> {
  const db = await adminDb();
  const ref = db.collection(COLLECTION).doc(id);
  await ref.collection("images").doc(imageId).delete();
  await ref.set({ updatedAt: new Date().toISOString() }, { merge: true });
}
