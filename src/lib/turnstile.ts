import "server-only";

// Cloudflare Turnstile verification.
//
// Fails OPEN when unconfigured and CLOSED when configured: with no
// TURNSTILE_SECRET_KEY set (local dev, preview builds, and every deploy before
// the keys are added) verification is skipped entirely, so nothing breaks. The
// moment a secret exists, a missing or invalid token is rejected.
//
// Setup: create a Turnstile widget in the Cloudflare dashboard, then set
//   NEXT_PUBLIC_TURNSTILE_SITE_KEY  (public, rendered into the widget)
//   TURNSTILE_SECRET_KEY            (server only, never exposed)

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function turnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export interface TurnstileResult {
  ok: boolean;
  /** Present when ok is false — safe to surface to the member. */
  error?: string;
}

/**
 * Verify a Turnstile token. `remoteIp` is optional but improves Cloudflare's
 * scoring; on Vercel it comes from the `x-forwarded-for` header.
 *
 * A network failure talking to Cloudflare is treated as a PASS rather than
 * locking members out of signup because of someone else's outage — bot
 * protection is not worth an availability incident on an auth path.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string | null
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true }; // not configured — no-op

  if (!token) return { ok: false, error: "Please complete the human check and try again." };

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    const data = (await res.json()) as { success?: boolean };
    return data.success
      ? { ok: true }
      : { ok: false, error: "That human check didn't pass — please try again." };
  } catch (err) {
    console.error("Turnstile verification unreachable, allowing through:", err);
    return { ok: true };
  }
}

/** Best-effort client IP from the request headers Vercel/Cloudflare set. */
export function clientIp(req: Request): string | null {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}
