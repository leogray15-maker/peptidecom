import { NextResponse } from "next/server";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { sweepLapsedMemberships } from "@/lib/stripe-sync";

// Nightly membership sweep: re-checks every account whose paid-up-to date has
// passed (and anyone stuck past due) against Stripe, then grants or revokes
// accordingly. Gated pages already re-check on load, so this only exists to
// catch lapsed members who never come back — without it they'd keep their
// Firestore chat claim indefinitely.
//
// Scheduled by Vercel Cron (vercel.json); Vercel sends
// `Authorization: Bearer ${CRON_SECRET}` automatically when CRON_SECRET is set.
// Admins can also trigger a run manually by hitting this route while signed in.
// Fails closed: with no secret configured and no admin session, it's refused.
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
    const summary = await sweepLapsedMemberships();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error("Membership sweep failed:", err);
    return NextResponse.json({ error: "Sweep failed." }, { status: 500 });
  }
}
