import "server-only";
import crypto from "crypto";

/** A simple, Firebase-independent admin session. Lets the owner log in with
 * their email + ADMIN_LOGIN_PASSWORD and get a signed cookie — reliable even
 * when Firebase/Google/DB aren't fully configured yet. */

export const ADMIN_COOKIE = "arcane_admin";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

function signingKey(): Buffer | null {
  const pw = process.env.ADMIN_LOGIN_PASSWORD;
  if (!pw) return null;
  return crypto.createHash("sha256").update("arcane-admin-session:" + pw).digest();
}

export function adminLoginConfigured(): boolean {
  return !!process.env.ADMIN_LOGIN_PASSWORD;
}

/** Create a signed token `base64url(email).exp.sig`, or null if not configured. */
export function signAdminToken(email: string): string | null {
  const key = signingKey();
  if (!key) return null;
  const exp = Date.now() + ADMIN_COOKIE_MAX_AGE * 1000;
  const sig = crypto.createHmac("sha256", key).update(`${email}.${exp}`).digest("base64url");
  return `${Buffer.from(email).toString("base64url")}.${exp}.${sig}`;
}

/** Verify a token and return the email, or null if invalid/expired. */
export function verifyAdminToken(token?: string): string | null {
  if (!token) return null;
  const key = signingKey();
  if (!key) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [emailB64, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;
  const email = Buffer.from(emailB64, "base64url").toString("utf8");
  const expected = crypto.createHmac("sha256", key).update(`${email}.${exp}`).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return email;
}
