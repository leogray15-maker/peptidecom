import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  postId: z.string(),
  value: z.union([z.literal(1), z.literal(-1)]),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { postId, value } = parsed.data;
  const existing = await prisma.vote.findUnique({
    where: { userId_postId: { userId: user.id, postId } },
  });

  if (existing && existing.value === value) {
    // toggle off
    await prisma.vote.delete({ where: { id: existing.id } });
  } else {
    await prisma.vote.upsert({
      where: { userId_postId: { userId: user.id, postId } },
      create: { userId: user.id, postId, value },
      update: { value },
    });
  }

  const agg = await prisma.vote.aggregate({
    where: { postId },
    _sum: { value: true },
  });

  return NextResponse.json({ ok: true, score: agg._sum.value ?? 0 });
}
