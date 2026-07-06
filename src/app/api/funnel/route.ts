import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { FUNNEL_EVENTS } from "@/lib/tsw";
import { logFunnel, markMilestoneCelebrated, tswKey } from "@/lib/tsw-db";

const schema = z.object({
  event: z.enum(FUNNEL_EVENTS),
  meta: z.record(z.unknown()).optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }

  const uid = tswKey(user);
  const { event, meta } = parsed.data;

  // Celebration acknowledgement doubles as marking the milestone celebrated.
  if (event === "milestone_celebrated" && typeof meta?.milestone === "string") {
    await markMilestoneCelebrated(uid, meta.milestone).catch((err) =>
      console.error("markMilestoneCelebrated failed:", err)
    );
  } else {
    await logFunnel(uid, event, meta);
  }

  return NextResponse.json({ ok: true });
}
