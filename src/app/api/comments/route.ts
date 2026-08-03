import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMember } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  postId: z.string(),
  content: z.string().min(1).max(10000),
});

export async function POST(req: Request) {
  const gate = await requireMember();
  if (gate.error) return gate.error;
  const user = gate.user;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  await prisma.comment.create({
    data: {
      postId: parsed.data.postId,
      content: parsed.data.content,
      authorId: user.id,
    },
  });

  return NextResponse.json({ ok: true });
}
