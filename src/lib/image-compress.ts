"use client";

// Client-side photo downscale + re-encode, shared by the photo timeline and the
// flare grading tool. Keeps uploads comfortably inside a Firestore document
// (the API caps the data-URL at 900k characters).
//
// Browser only — uses canvas. No network, no upload: the file never leaves the
// device in this module.

/** Downscale a picked file and return a JPEG data-URL under ~880k characters.
 * Steps down through progressively smaller sizes until it fits. */
export async function compressImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Couldn't read that image."));
      el.src = url;
    });

    for (const [maxDim, quality] of [
      [1000, 0.72],
      [720, 0.6],
      [520, 0.5],
    ] as const) {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL("image/jpeg", quality);
      if (data.length <= 880_000) return data;
    }
    throw new Error("That image couldn't be compressed enough — try a smaller one.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
