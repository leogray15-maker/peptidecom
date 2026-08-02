// Curated public testimonials — the hand-picked proof that runs on the sales
// pages (/, /pricing, /results).
//
// Two sources feed the public wall and they are deliberately separate:
//
//  1. This file — testimonials collected outside the app (DMs, messages,
//     photos sent over WhatsApp). They are curated by hand, one commit at a
//     time, and every entry records when the person gave permission to publish.
//  2. Member stories submitted through /won, which only ever reach a public
//     page once an admin flips "feature on site" — and that toggle is itself
//     gated on the member having ticked the marketing-consent box.
//
// Both render through the same PublicTestimonial shape so the wall doesn't
// care where a story came from.
//
// Safe for both server and client code (no server-only deps).

export interface TestimonialImage {
  /** Path under /public, or a data-URL for member-submitted photos. */
  src: string;
  alt: string;
  /** Shown beneath the image. */
  caption?: string;
  /** "screenshot" images (a message, a review) are shown uncropped so the
   * text stays readable; "photo" images are cropped to a consistent tile. */
  kind?: "photo" | "screenshot";
}

export interface Testimonial {
  id: string;
  /** First name only — never a full name, never a handle. */
  name: string;
  /** Condition id from lib/conditions.ts. */
  condition: string;
  /** One line in their own words, used on compact strips and cards. */
  highlight: string;
  /** The full message, verbatim. Light punctuation fixes only — never
   * rewritten, never embellished. */
  quote: string;
  /** e.g. "Visible change by day 4 · fully healed in 4 months". */
  timeframe?: string;
  images: TestimonialImage[];
  /** When permission to publish was given (ISO date). Keeping this in the
   * record means consent is auditable, not remembered. */
  consentedAt: string;
}

/** Where the curated image files live. Drop new files in /public/testimonials
 * and reference them here — see that folder's README for the convention. */
const IMG = "/testimonials";

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "daniel-eczema",
    name: "Daniel",
    condition: "eczema",
    highlight: "I'm fully healed now and I've never felt better.",
    quote:
      "Hey, I'm messaging just to literally thank you for introducing me to peptides to heal eczema. I'm fully healed now and I've never felt better in the last 4 months of hell. I really do wish you the best in everything in your business — thank you so much.",
    timeframe: "Visible change by day 4 · fully healed in 4 months",
    consentedAt: "2026-08-02",
    images: [
      {
        src: `${IMG}/daniel-hand-knuckles.jpg`,
        alt: "Daniel's hand, day 1 next to day 4 — raw broken skin over the knuckles calmed to clear skin",
        caption: "Knuckles & thumb — day 1 vs. day 4",
      },
      {
        src: `${IMG}/daniel-hand-back.jpg`,
        alt: "The back of Daniel's hand, day 1 next to day 4 — widespread redness settled to even skin tone",
        caption: "Back of the hand — day 1 vs. day 4",
      },
      {
        src: `${IMG}/daniel-hand-web.jpg`,
        alt: "The web between Daniel's thumb and finger, day 1 next to day 4 — an inflamed patch faded",
        caption: "Thumb web — day 1 vs. day 4",
      },
      {
        src: `${IMG}/daniel-torso.jpg`,
        alt: "Daniel's chest and torso, day 1 next to day 4 — spreading patches cleared",
        caption: "Chest & torso — day 1 vs. day 4",
      },
      {
        src: `${IMG}/daniel-message.jpg`,
        alt: "Screenshot of Daniel's message: “I'm fully healed now and I've never felt better in the last 4 months of hell”",
        caption: "Daniel's message, four months in",
        kind: "screenshot",
      },
    ],
  },
];

/** The one testimonial the landing page leads with. */
export const FEATURED_TESTIMONIAL_ID = "daniel-eczema";

// ─── Unified display shape ───────────────────────────────────────────────────

/** What the public wall renders, whichever source it came from. */
export interface PublicTestimonial {
  id: string;
  name: string;
  condition: string;
  highlight: string;
  quote: string;
  timeframe: string | null;
  images: TestimonialImage[];
  source: "curated" | "member";
  /** Member stories carry how far into their journey they were. */
  monthsIn?: number | null;
}

function toPublic(t: Testimonial): PublicTestimonial {
  return {
    id: t.id,
    name: t.name,
    condition: t.condition,
    highlight: t.highlight,
    quote: t.quote,
    timeframe: t.timeframe ?? null,
    images: t.images,
    source: "curated",
  };
}

export function curatedTestimonials(): PublicTestimonial[] {
  return TESTIMONIALS.map(toPublic);
}

export function featuredTestimonial(): PublicTestimonial | null {
  const t = TESTIMONIALS.find((x) => x.id === FEATURED_TESTIMONIAL_ID) ?? TESTIMONIALS[0];
  return t ? toPublic(t) : null;
}

// ─── Member stories → public testimonials ────────────────────────────────────

/** The slice of a RecoveryStory this conversion needs. Structural rather than
 * importing the type, so this module stays free of server-only imports. */
export interface StoryLike {
  id: string;
  authorName: string | null;
  title: string;
  body: string;
  monthsIn: number | null;
  condition?: string | null;
  prompts?: { hardest?: string | null; changed?: string | null; advice?: string | null } | null;
  marketingConsent?: boolean;
  photoConsent?: boolean;
  beforeImage?: string | null;
  afterImage?: string | null;
}

/** First name only — public pages never carry a member's full name. */
function firstName(name: string | null): string {
  const first = name?.trim().split(/\s+/)[0];
  return first && first.length > 0 ? first : "A member";
}

/** Convert a featured member story into a public testimonial.
 *
 * Returns null unless the member actually ticked marketing consent — the
 * admin toggle enforces this too, but a story that lost its consent flag must
 * never render publicly just because it was featured in the past. Photos are
 * dropped unless the separate photo-consent box was ticked as well. */
export function storyToPublicTestimonial(story: StoryLike): PublicTestimonial | null {
  if (story.marketingConsent !== true) return null;

  const images: TestimonialImage[] = [];
  if (story.photoConsent === true && story.beforeImage && story.afterImage) {
    images.push({
      src: story.beforeImage,
      alt: `${firstName(story.authorName)}'s skin before`,
      caption: "Before",
    });
    images.push({
      src: story.afterImage,
      alt: `${firstName(story.authorName)}'s skin after`,
      caption: "After",
    });
  }

  // The most quotable line first, same order the admin card generator uses.
  const highlight =
    story.prompts?.changed?.trim() || story.prompts?.advice?.trim() || story.title.trim();

  return {
    id: story.id,
    name: firstName(story.authorName),
    condition: story.condition ?? "tsw",
    highlight,
    quote: story.body.trim(),
    timeframe: story.monthsIn != null ? `${story.monthsIn} months in` : null,
    images,
    source: "member",
    monthsIn: story.monthsIn,
  };
}
