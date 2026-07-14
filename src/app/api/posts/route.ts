import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_CONDITION } from "@/lib/conditions";
import { prisma } from "@/lib/prisma";
import { getProfile, tswKey } from "@/lib/tsw-db";

const schema = z.object({
  title: z.string().min(3).max(160),
  content: z.string().min(1).max(20000),
  categoryId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  // Posts inherit the author's condition so the feed can default to
  // same-condition discussion.
  const condition = await getProfile(tswKey(user))
    .then((p) => p.condition ?? DEFAULT_CONDITION)
    .catch(() => DEFAULT_CONDITION);

  const post = await prisma.post.create({
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      categoryId: parsed.data.categoryId || null,
      authorId: user.id,
      condition,
    },
  });

  return NextResponse.json({ ok: true, id: post.id });
}
