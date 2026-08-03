// The proof wall — shared shapes for the admin-controlled social proof that
// runs on the public pages (/, /pricing, /results).
//
// Three things can appear on that wall, and the admin CRM controls all three
// from one screen (/admin/proof):
//
//  1. **custom**  — proof collected outside the app (a DM, a WhatsApp message,
//     photos someone sent). Written and photographed straight into the CRM;
//     nothing has to be committed to the repo or dropped into /public.
//  2. **curated** — the hand-committed entries in lib/testimonials.ts. The CRM
//     can hide them, reorder them, and upload photos that stand in for image
//     files that were never added to /public.
//  3. **story**   — member recovery stories from /won. Publishing one is the
//     existing "feature on site" toggle, which stays gated on the member's own
//     marketing consent.
//
// Every entry the CRM holds is one `ProofRecord` document. For curated and
// story entries the record is an *overlay*: it carries the controls (published,
// lead, order, replacement photos) while the words still come from their
// original source, so nothing is ever duplicated or allowed to drift.
//
// Safe for both server and client code (no server-only deps).

export type ProofSource = "custom" | "curated" | "story";

/** Photos are compressed client-side and stored as data-URLs, one Firestore
 * document each (they'd never fit together inside the record). This is the
 * ceiling the API enforces; the browser compresses to `PROOF_IMAGE_BUDGET`
 * first, which leaves headroom for the rest of the document. */
export const PROOF_IMAGE_MAX_CHARS = 500_000;
export const PROOF_IMAGE_BUDGET = 300_000;

/** Per-entry photo cap. The landing page shows the lead entry's photos in a
 * 3-across grid, so more than six is scroll, not proof. */
export const MAX_PROOF_IMAGES = 6;

export interface ProofImage {
  id: string;
  /** Compressed JPEG data-URL. */
  src: string;
  alt: string;
  caption: string | null;
  /** Screenshots (a message, a review) render uncropped so the text stays
   * readable; photos are cropped to a square tile. */
  kind: "photo" | "screenshot";
  order: number;
  createdAt: string;
}

/** One CRM-held entry. For curated/story overlays the content fields are null
 * and the words come from the origin. */
export interface ProofRecord {
  /** Document id. Overlays use a deterministic id so no lookup is needed —
   * see `proofRecordId`. */
  id: string;
  source: ProofSource;
  /** The curated testimonial id or the story id this overlays; null for custom. */
  sourceId: string | null;

  // ── Content (custom entries only) ──
  name: string | null;
  condition: string | null;
  /** The most quotable line — used on compact strips and pricing-page cards. */
  highlight: string | null;
  /** Their full message, verbatim. */
  quote: string | null;
  /** e.g. "Visible change by day 4 · fully healed in 4 months". */
  timeframe: string | null;
  /** ISO date they gave permission to publish. Publishing is refused without
   * it — consent stays a record rather than a memory. */
  consentedAt: string | null;
  /** Where and how permission was given, for the audit trail. */
  consentNote: string | null;

  // ── Controls (every source) ──
  /** Live on the public wall. Custom entries start unpublished — the CRM's
   * approve button is what puts anything on the site. */
  published: boolean;
  /** Manual sort position, ascending. Position 0 is the landing page's big
   * lead card, so "make this the lead" is just "move it to the top" — there's
   * no second flag that could disagree with the running order. */
  order: number;

  images: ProofImage[];
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

/** Deterministic document id, so an overlay can be read and written without
 * first querying for it. */
export function proofRecordId(source: ProofSource, sourceId: string): string {
  return source === "custom" ? sourceId : `${source}__${sourceId}`;
}

/** Curated entries are already live on the site today, so an absent overlay
 * means "published". Custom entries are the opposite: nothing goes public
 * until an admin approves it. Story entries are published by the existing
 * feature toggle, and their overlay only ever hides or reorders. */
export function defaultPublished(source: ProofSource): boolean {
  return source !== "custom";
}

/** Why a custom entry can't be published yet, or null when it's ready.
 * Mirrored by the API so a hand-rolled request can't skip it. */
export function publishBlocker(record: {
  source: ProofSource;
  name: string | null;
  quote: string | null;
  consentedAt: string | null;
}): string | null {
  if (record.source !== "custom") return null;
  if (!record.name?.trim()) return "Add a first name before publishing.";
  if (!record.quote?.trim()) return "Add their words before publishing.";
  if (!record.consentedAt) {
    return "Record the date they gave permission before publishing.";
  }
  return null;
}
