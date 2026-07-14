import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { CONDITION_IDS } from "@/lib/conditions";
import { setCondition, tswKey } from "@/lib/tsw-db";

const schema = z.object({
  condition: z.enum(CONDITION_IDS),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid condition." }, { status: 400 });
  }

  try {
    await setCondition(tswKey(user), parsed.data.condition);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to save condition:", err);
    return NextResponse.json(
      { error: "Couldn't save — the database isn't reachable yet." },
      { status: 503 }
    );
  }
}
