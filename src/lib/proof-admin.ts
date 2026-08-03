import "server-only";
import { safe } from "@/lib/safe-db";
import {
  type ProofRecord,
  type ProofSource,
  proofRecordId,
  publishBlocker,
} from "@/lib/proof";
import { listProofRecords, withProofImages } from "@/lib/proof-db";
import { TESTIMONIALS, storyToPublicTestimonial } from "@/lib/testimonials";
import { type RecoveryStory, getPhotosByIds, listStories } from "@/lib/tsw-db";

/** The admin's view of the proof wall: every candidate from every source, in
 * the order the public pages render them, with the controls each one supports.
 *
 * This is deliberately a superset of what `getPublicTestimonials` returns —
 * drafts and un-approved member stories show up here too, because approving
 * them is the whole point of the screen. */

export interface ProofRowImage {
  id: string;
  src: string;
  alt: string;
  caption: string | null;
  kind: "photo" | "screenshot";
}

export interface ProofRow {
  /** CRM document id — deterministic for curated/story overlays. */
  id: string;
  source: ProofSource;
  /** The curated id, story id, or (for custom entries) the document id. */
  sourceId: string;
  name: string;
  condition: string;
  quote: string;
  highlight: string;
  timeframe: string | null;
  consentedAt: string | null;
  consentNote: string | null;
  /** Rendering on the public site right now. */
  live: boolean;
  /** Photos held in the CRM — uploadable and removable from this screen. */
  images: ProofRowImage[];
  /** Photos this entry brings with it: image files under /public for curated
   * entries, the member's consented before/after for stories. Shown for
   * context; they can't be removed from here, only overridden by uploading
   * CRM photos. */
  fileImages: { src: string; alt: string; caption: string | null }[];
  /** True when the only photos on a live entry are /public file paths, which
   * render as placeholders if the files were never added to the repo. This is
   * the CRM's answer to "is the photo proof section actually working?". */
  filePhotosUnverified: boolean;
  /** Why this can't go live yet, or null when it's ready. */
  blocker: string | null;
  /** Whether the CRM already holds a document for this entry. */
  hasRecord: boolean;
  /** Free-text context for the row (consent provenance, story age…). */
  note: string | null;
  createdAt: string | null;
}

export interface ProofWall {
  /** Ordered exactly as the public pages render them. */
  live: ProofRow[];
  /** Everything the CRM knows about that isn't on the site: drafts, hidden
   * entries, and member stories waiting for approval. */
  offSite: ProofRow[];
  /** Live entries whose photos are all unverified /public file paths. Anything
   * above zero means the landing page may be showing photo placeholders. */
  liveNeedingPhotos: number;
  storiesAwaitingApproval: number;
}

/** First name only — the public wall never carries a full name. */
function firstName(name: string | null): string {
  const first = name?.trim().split(/\s+/)[0];
  return first && first.length > 0 ? first : "A member";
}

/** Resolve a story's before/after, but only when the member ticked the photo
 * box. Newer stories carry their photos inline; older ones point at the
 * member's timeline. */
async function storyPhotos(story: RecoveryStory): Promise<ProofRowImage[]> {
  if (story.photoConsent !== true) return [];

  let before = story.beforeImage ?? null;
  let after = story.afterImage ?? null;
  if ((!before || !after) && (story.beforePhotoId || story.afterPhotoId)) {
    const ids = [story.beforePhotoId, story.afterPhotoId].filter((x): x is string => !!x);
    const photos = await safe(() => getPhotosByIds(story.uid, ids), []);
    before ??= photos.find((p) => p.id === story.beforePhotoId)?.imageData ?? null;
    after ??= photos.find((p) => p.id === story.afterPhotoId)?.imageData ?? null;
  }

  const who = firstName(story.authorName);
  const pair: ProofRowImage[] = [];
  if (before) {
    pair.push({
      id: "before",
      src: before,
      alt: `${who}'s skin before`,
      caption: "Before",
      kind: "photo",
    });
  }
  if (after) {
    pair.push({
      id: "after",
      src: after,
      alt: `${who}'s skin after`,
      caption: "After",
      kind: "photo",
    });
  }
  return pair;
}

export async function getProofWall(): Promise<ProofWall> {
  const [bare, stories] = await Promise.all([
    safe(() => listProofRecords(), [] as ProofRecord[]),
    safe(() => listStories(200), [] as RecoveryStory[]),
  ]);
  // The admin screen shows every photo it holds, so unlike the public wall it
  // hydrates all of them up front.
  const records = await safe(() => withProofImages(bare), bare);
  const byId = new Map(records.map((r) => [r.id, r]));

  const rows: { row: ProofRow; order: number }[] = [];

  // ── Entries written straight into the CRM ──
  for (const record of records.filter((r) => r.source === "custom")) {
    const blocker = publishBlocker(record);
    rows.push({
      order: record.order,
      row: {
        id: record.id,
        source: "custom",
        sourceId: record.id,
        name: record.name ?? "Unnamed",
        condition: record.condition ?? "eczema",
        quote: record.quote ?? "",
        highlight: record.highlight?.trim() || record.quote || "",
        timeframe: record.timeframe,
        consentedAt: record.consentedAt,
        consentNote: record.consentNote,
        live: record.published && !blocker,
        images: record.images.map((i) => ({
          id: i.id,
          src: i.src,
          alt: i.alt,
          caption: i.caption,
          kind: i.kind,
        })),
        fileImages: [],
        filePhotosUnverified: false,
        blocker,
        hasRecord: true,
        note: record.consentNote,
        createdAt: record.createdAt,
      },
    });
  }

  // ── The hand-committed entries in lib/testimonials.ts ──
  TESTIMONIALS.forEach((t, i) => {
    const id = proofRecordId("curated", t.id);
    const record = byId.get(id);
    rows.push({
      order: record?.order ?? i,
      row: {
        id,
        source: "curated",
        sourceId: t.id,
        name: t.name,
        condition: t.condition,
        quote: t.quote,
        highlight: t.highlight,
        timeframe: t.timeframe ?? null,
        consentedAt: t.consentedAt,
        consentNote: null,
        live: record?.published ?? true,
        images: (record?.images ?? []).map((img) => ({
          id: img.id,
          src: img.src,
          alt: img.alt,
          caption: img.caption,
          kind: img.kind,
        })),
        fileImages: t.images.map((img) => ({
          src: img.src,
          alt: img.alt,
          caption: img.caption ?? null,
        })),
        filePhotosUnverified: (record?.images.length ?? 0) === 0 && t.images.length > 0,
        blocker: null,
        hasRecord: !!record,
        note: "Committed in the codebase — upload photos here to replace the image files.",
        createdAt: null,
      },
    });
  });

  // ── Member stories (only ever those whose author consented) ──
  const consented = stories.filter((s) => s.marketingConsent === true);
  const storyRows = await Promise.all(
    consented.map(async (story, i) => {
      const id = proofRecordId("story", story.id);
      const record = byId.get(id);
      const testimonial = storyToPublicTestimonial(story);
      const images = await storyPhotos(story);
      return {
        order: record?.order ?? 1000 + i,
        row: {
          id,
          source: "story" as const,
          sourceId: story.id,
          name: firstName(story.authorName),
          condition: story.condition ?? "tsw",
          quote: story.body,
          highlight: testimonial?.highlight ?? story.title,
          timeframe: story.monthsIn != null ? `${story.monthsIn} months in` : null,
          consentedAt: story.marketingConsentAt?.slice(0, 10) ?? null,
          consentNote: null,
          live: story.featured === true,
          images: (record?.images ?? []).map((img) => ({
            id: img.id,
            src: img.src,
            alt: img.alt,
            caption: img.caption,
            kind: img.kind,
          })),
          fileImages: images.map((img) => ({
            src: img.src,
            alt: img.alt,
            caption: img.caption,
          })),
          filePhotosUnverified: false,
          blocker: null,
          hasRecord: !!record,
          note: story.photoConsent
            ? "Member story — photo consent given."
            : "Member story — words only, no photo consent.",
          createdAt: story.createdAt,
        },
      };
    })
  );
  rows.push(...storyRows);

  // Position is the only ordering concept: whatever sits at the top of `live`
  // is the landing page's big lead card.
  rows.sort((a, b) => a.order - b.order);

  const live = rows.filter((r) => r.row.live).map((r) => r.row);
  const offSite = rows.filter((r) => !r.row.live).map((r) => r.row);

  return {
    live,
    offSite,
    liveNeedingPhotos: live.filter((r) => r.filePhotosUnverified).length,
    storiesAwaitingApproval: offSite.filter((r) => r.source === "story").length,
  };
}
