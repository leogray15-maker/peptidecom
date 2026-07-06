import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { adminAuth, isAdminConfigured, SESSION_COOKIE_NAME } from "@/lib/firebase-admin";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin-session";
import type { Role, SubscriptionStatus, User } from "@prisma/client";

/** Setup/preview mode: lets an admin into the member area with no login/DB so
 * the UI can be reviewed before auth is wired. Active when PREVIEW_MODE=true
 * OR while Firebase Admin isn't configured yet (self-heals: the moment real
 * admin credentials are set, this turns off and real auth is enforced). */
export function isPreviewMode() {
  if (process.env.PREVIEW_MODE === "false") return false; // explicit opt-out
  return (
    process.env.PREVIEW_MODE === "true" ||
    process.env.NEXT_PUBLIC_PREVIEW_MODE === "true" ||
    !isAdminConfigured()
  );
}

/** A synthetic admin used only in preview mode (never persisted). */
const PREVIEW_USER: User = {
  id: "preview-admin",
  firebaseUid: "preview-admin",
  name: "Preview Admin",
  username: "preview",
  email: "preview@arcanetrack.local",
  emailVerified: null,
  image: null,
  bio: null,
  role: "ADMIN",
  reputation: 0,
  verified: true,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  stripePriceId: null,
  stripeCurrentPeriodEnd: null,
  subscriptionStatus: "ACTIVE",
  foundingMember: false,
  comped: false,
  crmStage: null,
  crmTags: [],
  lastContactedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/** Statuses that grant access to gated content. */
const ACTIVE: SubscriptionStatus[] = ["ACTIVE", "TRIALING"];

/** True when the given subscription status currently grants access. */
export function isMember(status?: SubscriptionStatus | null) {
  return !!status && ACTIVE.includes(status);
}

/** Emails that are always granted ADMIN + full access, regardless of billing.
 * Configurable via ADMIN_EMAILS (comma-separated); defaults to the owner. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "leogray15@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null) {
  return !!email && adminEmails().includes(email.toLowerCase());
}

/** Whether a role is elevated (staff), which bypasses the paywall. */
export function isStaff(role?: Role | null) {
  return role === "ADMIN" || role === "MODERATOR";
}

/** Full access = an active subscription, staff (admin/moderator), or a
 * comped account (free access granted from the admin CRM). */
export function hasAccess(
  user?: { subscriptionStatus: SubscriptionStatus; role: Role; comped?: boolean } | null
) {
  if (!user) return false;
  return isStaff(user.role) || isMember(user.subscriptionStatus) || !!user.comped;
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

/** Verify the Firebase session cookie and return its decoded claims, or null.
 * Verification is pure JWT signature checking (offline, deterministic) — we
 * deliberately do NOT pass checkRevoked=true, which fires a Firebase network
 * call on every request: it adds latency to every page and a single transient
 * failure makes a signed-in admin randomly 401 mid-session. Sign-out clears
 * the cookie itself, and sessions cap at 14 days. */
export async function getSessionClaims() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!session) return null;
  return (await adminAuth()).verifySessionCookie(session);
}

/** Server-side helper: returns the current Postgres user (with fresh subscription
 * state) for the signed-in Firebase account, or null. Never throws on config/DB
 * errors so public pages render and gated pages redirect rather than 500. */
export async function getCurrentUser() {
  // 1. Reliable admin session cookie (Firebase-independent).
  try {
    const jar = await cookies();
    const adminEmail = verifyAdminToken(jar.get(ADMIN_COOKIE)?.value);
    if (adminEmail) {
      const dbUser = await prisma.user
        .findUnique({ where: { email: adminEmail } })
        .catch(() => null);
      if (dbUser) return dbUser;
      return { ...PREVIEW_USER, email: adminEmail, name: "Admin" };
    }
  } catch (err) {
    if (isNextControlFlowError(err)) throw err;
  }

  // 2. Firebase session cookie.
  try {
    const claims = await getSessionClaims();
    if (claims?.uid) {
      const user = await prisma.user.findUnique({ where: { firebaseUid: claims.uid } });
      if (user) return user;
    }
  } catch (err) {
    if (isNextControlFlowError(err)) throw err;
    // Expired/invalid cookie or unconfigured Firebase → fall through.
  }

  // 3. Preview mode: grant a synthetic admin so the member area is browsable.
  if (isPreviewMode()) return PREVIEW_USER;
  return null;
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
export async function syncMembershipClaim(
  firebaseUid: string,
  status: SubscriptionStatus,
  role: Role,
  comped = false
) {
  try {
    await (await adminAuth()).setCustomUserClaims(firebaseUid, {
      member: isMember(status) || isStaff(role) || comped,
      role,
    });
  } catch (err) {
    console.error("Failed to set membership claim:", err);
  }
}
