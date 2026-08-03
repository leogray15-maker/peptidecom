import "server-only";
import { safe } from "@/lib/safe-db";
import {
  type PublicTestimonial,
  type TestimonialImage,
  curatedTestimonials,
  storyToPublicTestimonial,
} from "@/lib/testimonials";
import { type ProofRecord, proofRecordId } from "@/lib/proof";
import { listProofRecords, withProofImages } from "@/lib/proof-db";
import { type RecoveryStory, getPhotosByIds, listFeaturedStories } from "@/lib/tsw-db";

/** The public proof wall, assembled from the three sources the admin CRM
 * controls (see lib/proof.ts): entries written straight into the CRM, the
 * hand-committed entries in lib/testimonials.ts, and member stories an admin
 * has featured.
 *
 * Never throws. If Firestore is unreachable the curated entries still render
 * on their own, which is exactly what the page did before the CRM existed. */

/** Resolve a featured story's before/after into data-URLs.
 *
 * Two routes in: photos uploaded with the story (already data-URLs), or photos
 * picked from the member's timeline (ids that need fetching). Either way this
 * only runs when the member ticked photo consent — an unconsented story goes
 * public as words alone, never pictures. */
async function withImages(story: RecoveryStory): Promise<RecoveryStory> {
  if (story.photoConsent !== true) return story;
  if (story.beforeImage && story.afterImage) return story;
  if (!story.beforePhotoId || !story.afterPhotoId) return story;

  const photos = await safe(
    () => getPhotosByIds(story.uid, [story.beforePhotoId!, story.afterPhotoId!]),
    []
  );
  return {
    ...story,
    beforeImage: photos.find((p) => p.id === story.beforePhotoId)?.imageData ?? null,
    afterImage: photos.find((p) => p.id === story.afterPhotoId)?.imageData ?? null,
  };
}

function recordImages(record: ProofRecord | undefined): TestimonialImage[] {
  return (record?.images ?? []).map((img) => ({
    src: img.src,
    alt: img.alt,
    caption: img.caption ?? undefined,
    kind: img.kind,
  }));
}

/** A candidate for the wall, before its photos have been fetched. */
interface Candidate {
  key: string;
  /** The CRM document holding this entry's controls, if it has one. */
  record?: ProofRecord;
  /** Sort position when the CRM has never touched this entry. Curated entries
   * keep their file order; stories queue up behind them, newest first. */
  fallbackOrder: number;
  /** Built once the photos are in. */
  build: (record?: ProofRecord) => PublicTestimonial | null;
}

/** Everything on the public wall, in the order the CRM says. */
export async function getPublicTestimonials(limit = 12): Promise<PublicTestimonial[]> {
  const [records, stories] = await Promise.all([
    safe(() => listProofRecords(), [] as ProofRecord[]),
    safe(() => listFeaturedStories(limit), [] as RecoveryStory[]),
  ]);
  const byId = new Map(records.map((r) => [r.id, r]));

  const candidates: Candidate[] = [];

  // 1. Entries written straight into the CRM. Unpublished ones are drafts.
  records
    .filter((r) => r.source === "custom" && r.published)
    .forEach((record) => {
      candidates.push({
        key: record.id,
        record,
        fallbackOrder: record.order,
        build: (r) =>
          r?.name && r.quote
            ? {
                id: r.id,
                name: r.name,
                condition: r.condition ?? "eczema",
                highlight: r.highlight?.trim() || r.quote,
                quote: r.quote,
                timeframe: r.timeframe,
                images: recordImages(r),
                source: "curated",
              }
            : null,
      });
    });

  // 2. The hand-committed entries. Live unless the CRM has hidden them, and
  //    CRM-uploaded photos stand in for image files that never made it into
  //    /public — which is how a testimonial gets pictures without a deploy.
  curatedTestimonials().forEach((t, i) => {
    const id = proofRecordId("curated", t.id);
    const record = byId.get(id);
    if (record && !record.published) return;
    candidates.push({
      key: id,
      record,
      fallbackOrder: i,
      build: (r) => {
        const uploaded = recordImages(r);
        return { ...t, images: uploaded.length > 0 ? uploaded : t.images };
      },
    });
  });

  // 3. Featured member stories. `featured` is the approval; the overlay only
  //    reorders them or pulls one back down.
  const resolved = await Promise.all(stories.map(withImages));
  resolved.forEach((story, i) => {
    const id = proofRecordId("story", story.id);
    const record = byId.get(id);
    if (record && !record.published) return;
    candidates.push({
      key: id,
      record,
      fallbackOrder: 1000 + i,
      // A member's story shows the member's own consented before/after and
      // nothing else — the CRM can reorder or pull it, but never swap in a
      // picture they didn't agree to publish.
      build: () => storyToPublicTestimonial(story),
    });
  });

  // Position is everything: whatever the CRM put first is the landing page's
  // big lead card, and the next two run as pull quotes.
  const ordered = candidates
    .sort((a, b) => (a.record?.order ?? a.fallbackOrder) - (b.record?.order ?? b.fallbackOrder))
    .slice(0, limit);

  // Photos are fetched only for the entries that survived the cut.
  const hydrated = await safe(
    () => withProofImages(ordered.map((c) => c.record).filter((r): r is ProofRecord => !!r)),
    [] as ProofRecord[]
  );
  const withPhotos = new Map(hydrated.map((r) => [r.id, r]));

  return ordered
    .map((c) => c.build(c.record ? (withPhotos.get(c.record.id) ?? c.record) : undefined))
    .filter((t): t is PublicTestimonial => t !== null);
}
