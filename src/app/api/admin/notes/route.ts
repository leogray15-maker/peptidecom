import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logActivity, requireAdminApi } from "@/lib/admin";

export const runtime = "nodejs";

const schema = z.object({
  userId: z.string().min(1),
  body: z.string().trim().min(1).max(5000),
});

export async function POST(req: Request) {
  const { admin, error } = await requireAdminApi();
  if (error) return error;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!target) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  const note = await prisma.crmNote.create({
    data: { userId: target.id, authorEmail: admin.email, body: parsed.data.body },
  });

  await logActivity({ actorEmail: admin.email, userId: target.id, action: "note.created" });

  return NextResponse.json({ ok: true, id: note.id });
}
