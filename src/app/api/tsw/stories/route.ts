import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { addStory, tswKey } from "@/lib/tsw-db";

const schema = z.object({
  title: z.string().min(3).max(160),
  body: z.string().min(20).max(20000),
  monthsIn: z.number().int().min(0).max(600).optional().nullable(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please add a title and at least a few sentences." },
      { status: 400 }
    );
  }

  try {
    const id = await addStory(tswKey(user), {
      title: parsed.data.title,
      body: parsed.data.body,
      monthsIn: parsed.data.monthsIn ?? null,
      authorName: user.name,
    });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("Failed to save story:", err);
    return NextResponse.json(
      { error: "Couldn't post your story — the database isn't reachable yet." },
      { status: 503 }
    );
  }
}
