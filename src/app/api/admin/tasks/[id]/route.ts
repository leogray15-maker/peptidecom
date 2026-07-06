import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logActivity, requireAdminApi } from "@/lib/admin";

export const runtime = "nodejs";

const patchSchema = z.object({
  status: z.enum(["OPEN", "DONE"]).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  details: z.string().trim().max(5000).nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueAt: z.string().nullable().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { admin, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }
  const input = parsed.data;

  const task = await prisma.crmTask.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  let dueAt: Date | null | undefined;
  if (input.dueAt !== undefined) {
    if (input.dueAt === null || input.dueAt === "") dueAt = null;
    else {
      const d = new Date(input.dueAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid due date." }, { status: 400 });
      }
      dueAt = d;
    }
  }

  await prisma.crmTask.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.details !== undefined && { details: input.details }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(dueAt !== undefined && { dueAt }),
      ...(input.status !== undefined && {
        status: input.status,
        completedAt: input.status === "DONE" ? new Date() : null,
      }),
    },
  });

  const action =
    input.status === "DONE"
      ? "task.completed"
      : input.status === "OPEN" && task.status === "DONE"
        ? "task.reopened"
        : "task.updated";
  await logActivity({ actorEmail: admin.email, userId: task.userId, action, detail: task.title });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { admin, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await ctx.params;
  const task = await prisma.crmTask.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  await prisma.crmTask.delete({ where: { id } });
  await logActivity({ actorEmail: admin.email, userId: task.userId, action: "task.deleted", detail: task.title });

  return NextResponse.json({ ok: true });
}
