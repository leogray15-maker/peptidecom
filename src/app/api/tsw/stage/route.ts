import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { TSW_STAGES, computeStats, earnedMilestones } from "@/lib/tsw";
import { awardNewMilestones, listLogs, setStage, tswKey } from "@/lib/tsw-db";

const schema = z.object({
  stage: z.enum(TSW_STAGES.map((s) => s.id) as [string, ...string[]]),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid stage." }, { status: 400 });
  }

  try {
    const uid = tswKey(user);
    await setStage(uid, parsed.data.stage);

    // Marking "recovered" is itself a milestone moment.
    let newMilestones: Awaited<ReturnType<typeof awardNewMilestones>> = [];
    if (parsed.data.stage === "recovered") {
      const logs = await listLogs(uid);
      newMilestones = await awardNewMilestones(
        uid,
        earnedMilestones(computeStats(logs), "recovered")
      );
    }
    return NextResponse.json({ ok: true, newMilestones });
  } catch (err) {
    console.error("Failed to set stage:", err);
    return NextResponse.json(
      { error: "Couldn't save your stage — the database isn't reachable yet." },
      { status: 503 }
    );
  }
}
