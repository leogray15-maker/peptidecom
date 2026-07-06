import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logActivity, requireAdminApi } from "@/lib/admin";

export const runtime = "nodejs";

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  details: z.string().trim().max(5000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueAt: z.string().optional(), // yyyy-mm-dd from <input type="date">
  userId: z.string().optional(),
});

export async function POST(req: Request) {
  const { admin, error } = await requireAdminApi();
  if (error) return error;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }
  const input = parsed.data;

  let dueAt: Date | undefined;
  if (input.dueAt) {
    const d = new Date(input.dueAt);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid due date." }, { status: 400 });
    }
    dueAt = d;
  }

  if (input.userId) {
    const target = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!target) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  }

  const task = await prisma.crmTask.create({
    data: {
      title: input.title,
      details: input.details,
      priority: input.priority,
      dueAt,
      userId: input.userId,
      createdBy: admin.email,
    },
  });

  await logActivity({
    actorEmail: admin.email,
    userId: input.userId,
    action: "task.created",
    detail: input.title,
  });

  return NextResponse.json({ ok: true, id: task.id });
}
