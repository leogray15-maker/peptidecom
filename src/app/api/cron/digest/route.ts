import { NextResponse } from "next/server";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { runDigest } from "@/lib/digest-db";

// Weekly personalised insight digest. Scheduled by Vercel Cron (vercel.json);
// Vercel sends `Authorization: Bearer ${CRON_SECRET}` automatically when the
// CRON_SECRET env var is set. Admins can trigger a run manually while signed
// in. Fails closed, exactly like /api/cron/aggregate.
//
// This job GENERATES payloads and stores them for in-app surfacing. It does
// not send push notifications — no transport is wired (docs/digest-delivery.md).
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization");
  let authorized = Boolean(secret) && header === `Bearer ${secret}`;

  if (!authorized) {
    const user = await getCurrentUser();
    authorized = isStaff(user?.role);
  }
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runDigest();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error("Digest run failed:", err);
    return NextResponse.json({ error: "Digest run failed." }, { status: 500 });
  }
}
