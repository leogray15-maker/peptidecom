"use client";

// Burn the AI-estimate disclaimer into an image, so it survives leaving the
// app. Browser only (uses canvas).
//
// Why burned-in rather than an overlay: an overlaid <div> disappears the
// moment the image is screenshotted, saved or dropped into a message, which is
// exactly when the label matters most. The banner is drawn in an opaque strip
// EXTENDED BELOW the photo rather than composited over it, so cropping the
// label off also crops the whole picture, and so the label never covers the
// skin a clinician is being shown.
//
// The stored original is never modified — watermarking happens at export time.

import { AI_ESTIMATE_LABEL } from "@/lib/ai-grading";

export interface WatermarkOptions {
  /** Extra line under the disclaimer, e.g. "Estimate 47/100 · 12 Mar 2026". */
  caption?: string | null;
  /** Model identifier, printed small for attributability. */
  modelId?: string | null;
}

/** Returns a JPEG data-URL of the image with a disclaimer strip beneath it. */
export async function watermarkPhoto(
  dataUrl: string,
  { caption = null, modelId = null }: WatermarkOptions = {}
): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Couldn't read that image."));
    el.src = dataUrl;
  });

  // Scale the strip with the image so it reads the same at any size.
  const w = img.width;
  const unit = Math.max(11, Math.round(w * 0.035));
  const pad = Math.round(unit * 0.7);
  const lines = 1 + (caption ? 1 : 0) + (modelId ? 1 : 0);
  const stripH = pad * 2 + lines * Math.round(unit * 1.35);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = img.height + stripH;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(img, 0, 0);
  ctx.fillStyle = "#0b0b10";
  ctx.fillRect(0, img.height, w, stripH);
  ctx.textBaseline = "top";

  let y = img.height + pad;
  const step = Math.round(unit * 1.35);

  ctx.font = `bold ${unit}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = "#fbbf24";
  ctx.fillText(AI_ESTIMATE_LABEL, pad, y);
  y += step;

  if (caption) {
    ctx.font = `${Math.round(unit * 0.85)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(caption, pad, y);
    y += step;
  }
  if (modelId) {
    ctx.font = `${Math.round(unit * 0.72)}px ui-monospace, monospace`;
    ctx.fillStyle = "#64748b";
    ctx.fillText(modelId, pad, y);
  }

  return canvas.toDataURL("image/jpeg", 0.9);
}

/** Trigger a browser download of a watermarked copy. */
export async function downloadWatermarked(
  dataUrl: string,
  filename: string,
  options?: WatermarkOptions
): Promise<void> {
  const out = await watermarkPhoto(dataUrl, options);
  const a = document.createElement("a");
  a.href = out;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
