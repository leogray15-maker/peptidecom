import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { adminAuth, SESSION_COOKIE_NAME } from "@/lib/firebase-admin";
import type { SubscriptionStatus } from "@prisma/client";

/** Statuses that grant access to gated content. */
const ACTIVE: SubscriptionStatus[] = ["ACTIVE", "TRIALING"];

/** True when the given subscription status currently grants access. */
export function isMember(status?: SubscriptionStatus | null) {
  return !!status && ACTIVE.includes(status);
}

/** Next.js uses thrown errors for control flow (redirect, notFound, dynamic
 * rendering). These must never be swallowed by a catch block or the build breaks. */
function isNextControlFlowError(err: unknown): boolean {
  if (typeof err !== "object" || err === null || !("digest" in err)) return false;
  const digest = (err as { digest?: unknown }).digest;
  return (
    typeof digest === "string" &&
    (digest === "DYNAMIC_SERVER_USAGE" ||
      digest.startsWith("NEXT_REDIRECT") ||
      digest.startsWith("NEXT_NOT_FOUND") ||
      digest.startsWith("NEXT_HTTP_ERROR_FALLBACK"))
  );
}

/** Verify the Firebase session cookie and return its decoded claims, or null. */
export async function getSessionClaims() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!session) return null;
  // verifySessionCookie(session, true) also checks for revocation.
  return (await adminAuth()).verifySessionCookie(session, true);
}

/** Server-side helper: returns the current Postgres user (with fresh subscription
 * state) for the signed-in Firebase account, or null. Never throws on config/DB
 * errors so public pages render and gated pages redirect rather than 500. */
export async function getCurrentUser() {
  try {
    const claims = await getSessionClaims();
    if (!claims?.uid) return null;
    return await prisma.user.findUnique({ where: { firebaseUid: claims.uid } });
  } catch (err) {
    if (isNextControlFlowError(err)) throw err;
    // Expired/invalid cookie or unconfigured Firebase → treat as logged out.
    return null;
  }
}

/** Lightweight signed-in check that never throws. Safe for public pages. */
export async function safeAuth() {
  try {
    const claims = await getSessionClaims();
    return claims ? { user: { uid: claims.uid, email: claims.email } } : null;
  } catch (err) {
    if (isNextControlFlowError(err)) throw err;
    return null;
  }
}

/**
 * Set the `member` and `role` custom claims on a Firebase user so Firestore
 * security rules can gate real-time features by membership. Best-effort.
 */
export async function syncMembershipClaim(firebaseUid: string, status: SubscriptionStatus, role: string) {
  try {
    await (await adminAuth()).setCustomUserClaims(firebaseUid, {
      member: isMember(status),
      role,
    });
  } catch (err) {
    console.error("Failed to set membership claim:", err);
  }
}
