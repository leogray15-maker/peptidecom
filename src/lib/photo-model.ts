// Tier B photo severity model — optional, still 100% free at runtime.
//
// Workflow (owner does this once, no code changes needed):
//   1. Train an image model at https://teachablemachine.withgoogle.com using
//      labeled example photos, with classes named as severity bands, e.g.
//      "0-20", "20-40", "40-60", "60-80", "80-100" (numbers = the 0–100 scale
//      used by the Tier A heuristic).
//   2. Export → TensorFlow.js → download, and drop the files into
//      public/models/skin-severity/ (model.json, metadata.json, *.bin).
//   3. Done. This loader detects the files and inference runs entirely in the
//      member's browser via @tensorflow/tfjs — no server cost, no per-call
//      billing, ever.
//
// COST POLICY (do not regress): no paid vision API may be added here or as a
// fallback anywhere in the photo-scoring path (no GPT-4V / Claude vision /
// Google Vision / hosted GPU inference). Those options need an explicitly
// approved budget and a deliberate decision — never a silent code change.
//
// While the model files are absent (the default), this module costs nothing:
// one 404'd HEAD request per session, and the tfjs chunk is never downloaded
// (it's behind a dynamic import that only runs after the files are found).

const MODEL_DIR = "/models/skin-severity";
const MODEL_URL = `${MODEL_DIR}/model.json`;
const METADATA_URL = `${MODEL_DIR}/metadata.json`;
const INPUT_SIZE = 224; // Teachable Machine image models take 224×224

export interface PhotoModel {
  /** Predict a 0–100 severity estimate for an image element. */
  predict: (img: HTMLImageElement) => Promise<number | null>;
}

let cached: Promise<PhotoModel | null> | null = null;

/** Load the Tier B model if its files have been deployed; null otherwise.
 * Cached for the session either way. Browser only. */
export function loadPhotoModel(): Promise<PhotoModel | null> {
  cached ??= load().catch((err) => {
    console.warn("Photo model unavailable, using heuristic only:", err);
    return null;
  });
  return cached;
}

async function load(): Promise<PhotoModel | null> {
  if (typeof window === "undefined") return null;
  const head = await fetch(MODEL_URL, { method: "HEAD" }).catch(() => null);
  if (!head?.ok) return null; // no model deployed — Tier A heuristic only

  // Only now pay for the tfjs chunk.
  const tf = await import("@tensorflow/tfjs");
  const model = await tf.loadLayersModel(MODEL_URL);

  // Class labels from Teachable Machine's metadata; parsed as numeric bands.
  const meta = (await fetch(METADATA_URL)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)) as { labels?: string[] } | null;
  const labels = meta?.labels ?? [];
  const midpoints = labels.map((l, i) => labelMidpoint(l, i, labels.length));

  return {
    async predict(img: HTMLImageElement): Promise<number | null> {
      const canvas = document.createElement("canvas");
      canvas.width = INPUT_SIZE;
      canvas.height = INPUT_SIZE;
      canvas.getContext("2d")!.drawImage(img, 0, 0, INPUT_SIZE, INPUT_SIZE);
      const scores = tf.tidy(() => {
        // Teachable Machine image models expect pixels normalised to [-1, 1].
        const input = tf.browser
          .fromPixels(canvas)
          .toFloat()
          .div(127.5)
          .sub(1)
          .expandDims(0);
        return model.predict(input) as InstanceType<typeof tf.Tensor>;
      });
      try {
        const probs = Array.from(await scores.data());
        if (probs.length === 0 || probs.length !== midpoints.length) return null;
        // Probability-weighted midpoint of the severity bands → 0–100.
        const expected = probs.reduce((s, p, i) => s + p * midpoints[i], 0);
        return Math.round(Math.min(100, Math.max(0, expected)));
      } finally {
        scores.dispose();
      }
    },
  };
}

/** "20-40" → 30 · "75" → 75 · unparseable labels spread evenly over 0–100. */
export function labelMidpoint(label: string, index: number, total: number): number {
  const range = label.match(/^\s*(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*$/);
  if (range) return (parseFloat(range[1]) + parseFloat(range[2])) / 2;
  const single = label.match(/^\s*(\d+(?:\.\d+)?)\s*$/);
  if (single) return parseFloat(single[1]);
  return total > 1 ? (index / (total - 1)) * 100 : 50;
}
