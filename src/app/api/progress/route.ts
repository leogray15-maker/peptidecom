import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  date: z.string().optional(),
  weightKg: z.number().positive().max(700).optional().nullable(),
  waistCm: z.number().positive().max(400).optional().nullable(),
  bodyFatPct: z.number().min(0).max(100).optional().nullable(),
  mood: z.number().int().min(1).max(5).optional().nullable(),
  sideEffects: z.string().max(2000).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { date, ...rest } = parsed.data;
  const log = await prisma.progressLog.create({
    data: {
      userId: user.id,
      date: date ? new Date(date) : new Date(),
      ...rest,
    },
  });

  return NextResponse.json({ ok: true, log });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.progressLog.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
