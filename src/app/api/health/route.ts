import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Safe health/diagnostics endpoint. Never throws — reports what is and isn't
 * wired up so a misconfigured deploy is easy to debug. Exposes only booleans
 * and error messages, never secret values. */
export async function GET() {
  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    NEXT_PUBLIC_FIREBASE_API_KEY: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_MONTHLY: !!process.env.STRIPE_PRICE_MONTHLY,
    STRIPE_PRICE_ANNUAL: !!process.env.STRIPE_PRICE_ANNUAL,
  };

  let database = { ok: false, error: "" as string };
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    database = { ok: true, error: "" };
  } catch (e) {
    database = { ok: false, error: (e as Error).message?.split("\n")[0] ?? "failed" };
  }

  let firebaseAdmin = { ok: false, error: "" as string };
  try {
    const { adminAuth } = await import("@/lib/firebase-admin");
    await adminAuth().createCustomToken("health-check");
    firebaseAdmin = { ok: true, error: "" };
  } catch (e) {
    firebaseAdmin = { ok: false, error: (e as Error).message?.split("\n")[0] ?? "failed" };
  }

  return NextResponse.json({
    ok: database.ok && firebaseAdmin.ok,
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    env,
    database,
    firebaseAdmin,
  });
}
