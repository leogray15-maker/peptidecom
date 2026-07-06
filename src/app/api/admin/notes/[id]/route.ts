import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logActivity, requireAdminApi } from "@/lib/admin";

export const runtime = "nodejs";

const patchSchema = z.object({ pinned: z.boolean() });

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { admin, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const note = await prisma.crmNote.findUnique({ where: { id } });
  if (!note) return NextResponse.json({ error: "Note not found." }, { status: 404 });

  await prisma.crmNote.update({ where: { id }, data: { pinned: parsed.data.pinned } });
  await logActivity({
    actorEmail: admin.email,
    userId: note.userId,
    action: parsed.data.pinned ? "note.pinned" : "note.unpinned",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { admin, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await ctx.params;
  const note = await prisma.crmNote.findUnique({ where: { id } });
  if (!note) return NextResponse.json({ error: "Note not found." }, { status: 404 });

  await prisma.crmNote.delete({ where: { id } });
  await logActivity({ actorEmail: admin.email, userId: note.userId, action: "note.deleted" });

  return NextResponse.json({ ok: true });
}
