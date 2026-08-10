"use client";

// One grading pipeline, shared by the AI flare grading tool (grade-client) and
// the photo timeline uploader (photos-client). Both used to inline their own
// copy of "extract features → pick baseline → score → blend the local model",
// which is exactly the sort of duplication that lets two screens disagree
// about the same photo. Keep the pipeline here.
//
// COST POLICY (do not regress): everything below runs in the member's browser.
// No paid vision API, ever — see the notes in photo-score.ts / photo-model.ts.

import {
  type BaselineCandidate,
  type PhotoEstimate,
  type PhotoFeatures,
  type PhotoRejection,
  PHOTO_SCORE_VERSION,
  extractImageFeatures,
  pickBaseline,
  scorePhoto,
} from "@/lib/photo-score";
import { loadPhotoModel } from "@/lib/photo-model";

export type GradeResult =
  | { ok: true; estimate: PhotoEstimate; features: PhotoFeatures; baseline: BaselineCandidate | null }
  | { ok: false; reason: PhotoRejection };

export interface GradeInput {
  /** Compressed data-URL of the photo (never uploaded by this module). */
  dataUrl: string;
  /** The member's previously scored photos, for the personal baseline. */
  scored: BaselineCandidate[];
  /** Selected body area, or null. */
  area: string | null;
  /** date → manual severity 1–10, so a baseline can be gated on a calm day. */
  manualSeverityByDate: Record<string, number>;
}

/** Grade one photo end to end, entirely on-device. */
export async function gradePhoto({
  dataUrl,
  scored,
  area,
  manualSeverityByDate,
}: GradeInput): Promise<GradeResult> {
  const features = await extractImageFeatures(dataUrl);
  const baseline = pickBaseline(scored, area, manualSeverityByDate);
  const graded = scorePhoto(features, baseline);
  if (!graded.ok) return graded;

  let score = graded.score;
  let method: PhotoEstimate["method"] = "heuristic";

  // Tier B: only if the owner has deployed model files (see photo-model.ts).
  // A model failure must never sink the heuristic result.
  try {
    const model = await loadPhotoModel();
    if (model) {
      const img = await decode(dataUrl);
      const modelScore = await model.predict(img);
      if (modelScore != null) {
        score = Math.round((graded.score + modelScore) / 2);
        method = "blended";
      }
    }
  } catch {
    // Heuristic-only result stands.
  }

  return {
    ok: true,
    features,
    baseline,
    estimate: {
      score,
      composite: features.composite,
      inflamedFraction: features.inflamedFraction,
      rednessIndex: features.rednessIndex,
      erythemaContrast: features.erythemaContrast,
      textureIndex: features.textureIndex,
      // Carried onto the saved estimate so a historical grading still says how
      // much the photo it came from could actually support.
      confidence: features.confidence,
      qualityFlags: features.qualityFlags,
      version: PHOTO_SCORE_VERSION,
      method,
      basis: graded.basis,
    },
  };
}

function decode(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode failed"));
    img.src = dataUrl;
  });
}
