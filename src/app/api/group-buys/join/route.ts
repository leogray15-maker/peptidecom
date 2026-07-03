import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  groupBuyId: z.string(),
  units: z.number().int().min(1).max(100).default(1),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { groupBuyId, units } = parsed.data;
  const gb = await prisma.groupBuy.findUnique({ where: { id: groupBuyId } });
  if (!gb || gb.status !== "OPEN") {
    return NextResponse.json({ error: "This group buy is not open." }, { status: 400 });
  }

  const existing = await prisma.groupBuyMember.findUnique({
    where: { groupBuyId_userId: { groupBuyId, userId: user.id } },
  });

  if (existing) {
    await prisma.groupBuyMember.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, joined: false });
  }

  await prisma.groupBuyMember.create({
    data: { groupBuyId, userId: user.id, units },
  });
  return NextResponse.json({ ok: true, joined: true });
}
