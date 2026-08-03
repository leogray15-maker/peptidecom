import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMember } from "@/lib/api-auth";
import type { DigestPrefs } from "@/lib/notifications";
import { setDigestPrefs, tswKey } from "@/lib/tsw-db";

// Weekly digest preferences. Push is strictly opt-in for a health app, so
// `enabled` only ever becomes true through an explicit request from the
// member — there is no default-on path and no server-side backfill.

const schema = z.object({
  enabled: z.boolean(),
  inApp: z.boolean(),
  quietStart: z.number().int().min(0).max(23),
  quietEnd: z.number().int().min(0).max(23),
  // Browser's Date#getTimezoneOffset is minutes to ADD to local to get UTC,
  // i.e. the negation of what we store.
  utcOffsetMinutes: z.number().int().min(-840).max(840),
});

export async function POST(req: Request) {
  const gate = await requireMember();
  if (gate.error) return gate.error;
  const user = gate.user;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const prefs: DigestPrefs = {
    ...parsed.data,
    optedInAt: parsed.data.enabled ? new Date().toISOString() : null,
  };

  try {
    await setDigestPrefs(tswKey(user), prefs);
    return NextResponse.json({ ok: true, prefs });
  } catch (err) {
    console.error("Failed to save digest prefs:", err);
    return NextResponse.json(
      { error: "Couldn't save that — the database isn't reachable yet." },
      { status: 503 }
    );
  }
}
