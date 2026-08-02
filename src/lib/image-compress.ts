"use client";

// Client-side photo downscale + re-encode, shared by the photo timeline, the
// flare grading tool and the recovery-story before/after uploader. Keeps
// uploads comfortably inside a Firestore document (the photos API caps the
// data-URL at 900k characters; story images get a tighter budget because two
// of them share one document — see lib/story-images.ts).
//
// Browser only — uses canvas. No network, no upload: the file never leaves the
// device in this module.

/** Progressively smaller size/quality steps. The first one that fits the
 * caller's budget wins, so a small budget simply walks further down. */
const STEPS = [
  [1000, 0.72],
  [720, 0.6],
  [520, 0.5],
  [400, 0.45],
  [320, 0.4],
] as const;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Couldn't read that image."));
    el.src = src;
  });
}

function encodeUnder(img: HTMLImageElement, maxChars: number): string {
  for (const [maxDim, quality] of STEPS) {
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL("image/jpeg", quality);
    if (data.length <= maxChars) return data;
  }
  throw new Error("That image couldn't be compressed enough — try a smaller one.");
}

/** Downscale a picked file and return a JPEG data-URL under `maxChars`. */
export async function compressImage(file: File, maxChars = 880_000): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    return encodeUnder(await loadImage(url), maxChars);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Re-compress an existing data-URL to fit a smaller budget — used when a
 * timeline photo (up to ~880k) is attached to a story (up to ~380k). Returns
 * the original untouched when it already fits. */
export async function compressDataUrl(dataUrl: string, maxChars: number): Promise<string> {
  if (dataUrl.length <= maxChars) return dataUrl;
  return encodeUnder(await loadImage(dataUrl), maxChars);
}
