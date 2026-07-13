import { NextResponse } from "next/server";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { runAggregation } from "@/lib/insights-db";

// Nightly cohort-insights aggregation. Scheduled by Vercel Cron (vercel.json);
// Vercel sends `Authorization: Bearer ${CRON_SECRET}` automatically when the
// CRON_SECRET env var is set. Admins can also trigger a run manually by
// hitting this route while signed in. Fails closed: with no secret configured
// and no admin session, the run is refused.
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
    const summary = await runAggregation();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error("Aggregation run failed:", err);
    return NextResponse.json({ error: "Aggregation failed." }, { status: 500 });
  }
}
