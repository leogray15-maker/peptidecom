/**
 * Edge gate for the flare-photo submission endpoint.
 *
 * Deployed in front of `POST /api/tsw/photos`, it enforces the two abuse and
 * cost controls from the compliance work at the cheapest possible failure
 * point: a rejected request never reaches Vercel, never reaches Firestore, and
 * never costs a function invocation.
 *
 *   1. Per-user rate limiting, backed by a Durable Object counter.
 *   2. Non-skin rejection, using Cloudflare Images to decode and downscale the
 *      submitted photo so the same skin-fraction heuristic the browser runs can
 *      be evaluated somewhere the member cannot tamper with it.
 *
 * NOT YET DEPLOYED. This is the reviewable implementation for the Cloudflare
 * work — see docs/cloudflare-scope.md for the routing, secrets and rollout
 * order it needs. The app-layer checks in src/app/api/tsw/photos/route.ts stay
 * in place either way; this makes them cheaper, not redundant.
 */

export interface Env {
  RATE_LIMITER: DurableObjectNamespace;
  /** Origin to forward accepted requests to, e.g. https://arcane.app */
  ORIGIN: string;
  /** Shared secret proving a request came through this Worker. */
  GATE_SECRET: string;
}

/** Keep in sync with PHOTO_RATE_LIMIT in src/lib/ai-grading.ts. */
const RATE_LIMIT = { max: 40, windowMs: 60 * 60 * 1000 };
/** Keep in sync with MIN_SKIN_FRACTION in src/lib/ai-grading.ts. */
const MIN_SKIN_FRACTION = 0.25;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method !== "POST" || !url.pathname.startsWith("/api/tsw/photos")) {
      return forward(req, env);
    }

    // Identity comes from the session cookie, not a client-supplied field —
    // the Worker only needs a stable key, not the decoded user.
    const key = sessionKey(req);
    if (!key) return forward(req, env); // unauthenticated: the app will 401 it

    const id = env.RATE_LIMITER.idFromName(key);
    const limiter = env.RATE_LIMITER.get(id);
    const verdict = await limiter.fetch("https://limiter/check").then((r) => r.json<{
      allowed: boolean;
      retryAfter: number;
    }>());

    if (!verdict.allowed) {
      return json(
        { error: `That's ${RATE_LIMIT.max} photos in an hour — take a break and try again later.` },
        429,
        { "Retry-After": String(verdict.retryAfter) }
      );
    }

    // Body is read once, checked, then replayed to the origin.
    const body = await req.text();
    const parsed = safeParse(body);
    if (parsed?.imageData) {
      const skinFraction = await skinFractionOf(parsed.imageData);
      if (skinFraction !== null && skinFraction < MIN_SKIN_FRACTION) {
        return json(
          { error: "That doesn't look like a photo of skin. Fill the frame with the patch you want estimated." },
          422
        );
      }
    }

    return forward(new Request(req, { body }), env);
  },
};

/** Durable Object: one rolling-window counter per member. */
export class RateLimiter {
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(): Promise<Response> {
    const now = Date.now();
    const hits = ((await this.state.storage.get<number[]>("hits")) ?? []).filter(
      (t) => now - t < RATE_LIMIT.windowMs
    );

    if (hits.length >= RATE_LIMIT.max) {
      const retryAfter = Math.ceil((RATE_LIMIT.windowMs - (now - hits[0])) / 1000);
      return Response.json({ allowed: false, retryAfter });
    }

    hits.push(now);
    await this.state.storage.put("hits", hits);
    return Response.json({ allowed: true, retryAfter: 0 });
  }
}

/**
 * Skin-plausibility share of a data-URL image.
 *
 * Workers have no canvas, so the decode goes through Cloudflare Images'
 * resizing pipeline (`cf.image`), which hands back a small raw bitmap the same
 * pixel maths can run over. Returns null when the image can't be decoded — an
 * undecodable image is the app layer's problem to reject, not a reason to fail
 * the whole request here.
 */
async function skinFractionOf(dataUrl: string): Promise<number | null> {
  const match = /^data:(image\/[a-z]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;

  try {
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    // Downscale hard: the heuristic is scale-invariant and 64×64 is plenty.
    const resized = await fetch(
      new Request("https://images.internal/decode", {
        method: "POST",
        body: bytes,
        headers: { "Content-Type": match[1] },
        // @ts-expect-error — `cf` is a Workers-only request property
        cf: { image: { width: 64, height: 64, fit: "cover", format: "rgba" } },
      })
    );
    if (!resized.ok) return null;
    const raw = new Uint8ClampedArray(await resized.arrayBuffer());
    return computeSkinFraction(raw);
  } catch {
    return null;
  }
}

/** Port of isSkinLike/computePhotoFeatures from src/lib/photo-score.ts.
 * Generous by design: rejecting deeper skin tones would be a fairness bug in a
 * health product, so the band admits every human tone.
 *
 * This is deliberately the COLOUR-ONLY mask, matching `skinFraction` in
 * photo-score.ts exactly. The grading engine additionally drops hair and cast
 * shadow before it measures anything, but that pass is about measurement
 * quality, not about "is this a photo of a person" — folding it in here would
 * make the abuse gate reject a legitimate photo of a hairy forearm. Keep the
 * constants below identical to the ones in photo-score.ts. */
export function computeSkinFraction(data: Uint8ClampedArray): number {
  let usable = 0;
  let skin = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    if (max < 0.12 || max > 0.99) continue; // shadow / blown highlight
    usable++;
    const s = max === 0 ? 0 : (max - min) / max;
    if (s < 0.1 || s > 0.88) continue;
    if (r - b < 8) continue;
    const h = hueOf(r, g, b);
    if (h <= 50 || h >= 330) skin++;
  }
  return usable > 0 ? skin / usable : 0;
}

function hueOf(r: number, g: number, b: number): number {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const d = max - Math.min(rn, gn, bn);
  if (d === 0) return 0;
  let h: number;
  if (max === rn) h = 60 * (((gn - bn) / d) % 6);
  else if (max === gn) h = 60 * ((bn - rn) / d + 2);
  else h = 60 * ((rn - gn) / d + 4);
  return h < 0 ? h + 360 : h;
}

function sessionKey(req: Request): string | null {
  const cookie = req.headers.get("cookie") ?? "";
  const match = /(?:^|;\s*)arcane_session=([^;]+)/.exec(cookie);
  // The cookie value is opaque to the Worker; only its stability matters, and
  // hashing keeps the session token itself out of Durable Object names.
  return match ? fnv1a(match[1]) : null;
}

function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16);
}

function safeParse(body: string): { imageData?: string } | null {
  try {
    return JSON.parse(body) as { imageData?: string };
  } catch {
    return null;
  }
}

function forward(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const target = new URL(url.pathname + url.search, env.ORIGIN);
  const headers = new Headers(req.headers);
  headers.set("x-arcane-gate", env.GATE_SECRET);
  return fetch(new Request(target, { ...req, headers } as RequestInit));
}

function json(payload: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}
