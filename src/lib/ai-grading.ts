// AI Flare Grading — compliance constants and pure helpers.
//
// Safe to import from both server and client code (no server-only deps).
//
// FRAMING RULE (do not regress): nothing in this feature may read as
// diagnosing, detecting or identifying a condition. The product claim is
// exactly one thing — "an estimate to help you describe your flare to a
// clinician". Every user-facing string that touches photo grading is either
// defined here or must pass the audit in scripts/ai-grading.test.ts.
//
// Three mechanisms carry the compliance weight, in this order:
//   1. The one-time consent screen (explicit affirmative action, versioned,
//      persisted server-side against the account — see CONSENT_VERSION).
//   2. The persistent, non-removable estimate label (AI_ESTIMATE_LABEL) on
//      every result surface, saved photo card and export.
//   3. The BETA badge — supporting signal only, never the sole disclosure.

import type { PhotoEstimate } from "@/lib/photo-score";

// ─── Persistent labelling ────────────────────────────────────────────────────

/** The label that must appear on every AI-graded result: in the UI, burned
 * into exported images, and in report exports. Not dismissible, not
 * croppable, never behind a tooltip. */
export const AI_ESTIMATE_LABEL = "AI estimate — not a diagnosis";

/** Longer form for reports and export footers, where there's room. */
export const AI_ESTIMATE_LABEL_LONG =
  "AI estimate — not a diagnosis. Generated on-device from photo colour; " +
  "intended to help describe a flare to a clinician, not to replace one.";

// ─── Model attributability ───────────────────────────────────────────────────

/** Identifier for the Tier A heuristic, versioned with the maths. Bump
 * PHOTO_SCORE_VERSION in photo-score.ts and this string moves with it. */
export const HEURISTIC_MODEL_ID = "arcane-heuristic";

/** Identifier for the optional Tier B local model (public/models/skin-severity).
 * Bump when new model files are deployed so old gradings stay attributable to
 * the model that actually produced them. */
export const LOCAL_MODEL_ID = "skin-severity-tm";
export const LOCAL_MODEL_VERSION = 1;

/** Stable, human-readable model identifier stored alongside every grading.
 * Examples: "arcane-heuristic@1" · "arcane-heuristic@1+skin-severity-tm@1". */
export function modelIdFor(
  method: PhotoEstimate["method"],
  scoreVersion: number,
  localModelVersion: number = LOCAL_MODEL_VERSION
): string {
  const base = `${HEURISTIC_MODEL_ID}@${scoreVersion}`;
  const local = `${LOCAL_MODEL_ID}@${localModelVersion}`;
  if (method === "tfjs") return local;
  if (method === "blended") return `${base}+${local}`;
  return base;
}

/** Plain-English method name for the "about this estimate" view. */
export function methodLabel(method: PhotoEstimate["method"]): string {
  if (method === "tfjs") return "On-device image model";
  if (method === "blended") return "Colour analysis blended with an on-device image model";
  return "Colour analysis";
}

// ─── Consent ─────────────────────────────────────────────────────────────────

/** Bump ONLY when the disclaimer copy below changes materially — i.e. when a
 * member who already agreed would be agreeing to something different. Every
 * member is re-prompted on a bump; historical gradings keep the version they
 * were made under (see RETROACTIVE_RELABEL_POLICY). */
export const CONSENT_VERSION = 1;

export interface AiGradingConsent {
  version: number;
  /** ISO timestamp of the affirmative action. */
  acceptedAt: string;
}

/** The consent screen's copy, kept as data so the audit test can assert on it
 * and so a copy change is visibly a version-bump decision. */
export const CONSENT_COPY = {
  title: "Before your first estimate",
  intro:
    "AI Flare Grading gives you a rough 0–100 estimate of how inflamed a patch looks in a photo. It exists to help you describe your flare to a clinician — nothing more.",
  points: [
    "It is an estimate, not a diagnosis. It cannot tell you what condition you have, and it never tries to.",
    "It does not replace a clinician. Nothing here is medical advice, and no result should change your treatment on its own.",
    "It reads colour, so lighting, makeup, moisturiser shine and camera white balance all move the number. It is markedly less reliable on deeper skin tones, where inflammation shows as violet or grey-brown rather than red.",
    "Your own rating in the daily tracker stays the real record. The estimate supplements it and never overwrites it.",
    "The photo is analysed on your device. Nothing is uploaded unless you choose to save it to your timeline.",
  ],
  /** The affirmative action. Must be an explicit tap — never a dismissible
   * toast, never an implied "by continuing you agree". */
  acceptLabel: "I understand — it's an estimate, not a diagnosis",
  declineLabel: "Not now",
} as const;

/**
 * RETROACTIVE RELABEL POLICY (documented decision — flagged for review).
 *
 * When CONSENT_VERSION is bumped, gradings made under the previous version
 * keep the `consentVersion` they were created with. They are NOT retroactively
 * re-labelled, because the label records what the member was actually told at
 * the time — rewriting it would destroy the audit trail the versioning exists
 * to create. Going forward, new gradings carry the new version.
 */
export const RETROACTIVE_RELABEL_POLICY = "historical-labels-preserved" as const;

/** Whether the stored consent still satisfies the current copy version. */
export function needsConsent(consent: AiGradingConsent | null | undefined): boolean {
  return !consent || consent.version < CONSENT_VERSION;
}

// ─── Abuse / cost controls ───────────────────────────────────────────────────

/** Photo submissions accepted per member per rolling window. Generous enough
 * that a member photographing several areas a day never notices, tight enough
 * that a scripted loop is stopped at the boundary. */
export const PHOTO_RATE_LIMIT = { max: 40, windowMs: 60 * 60 * 1000 } as const;

/**
 * Minimum share of sampled pixels that must read as plausible skin before a
 * photo is graded or stored as a flare photo. A screenshot, a meme, a photo of
 * a wall or a pet clears almost none of this; a badly lit forearm still clears
 * it comfortably.
 */
export const MIN_SKIN_FRACTION = 0.25;

export const NON_SKIN_MESSAGE =
  "That doesn't look like a photo of skin. Fill the frame with the patch you want estimated.";
