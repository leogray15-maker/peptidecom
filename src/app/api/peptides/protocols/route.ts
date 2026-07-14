import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { RESEARCH_GOALS } from "@/lib/tsw";
import { addProtocol, deleteProtocol, setProtocolActive, tswKey } from "@/lib/tsw-db";

const createSchema = z.object({
  peptide: z.string().min(1).max(80),
  doseMg: z.number().positive().max(1000),
  schedule: z.object({
    type: z.enum(["daily", "weekly"]),
    days: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  }),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional()
    .nullable(),
  purpose: z.enum(RESEARCH_GOALS.map((g) => g.id) as [string, ...string[]]).optional().nullable(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }
  const d = parsed.data;
  if (d.schedule.type === "weekly" && (d.schedule.days?.length ?? 0) === 0) {
    return NextResponse.json({ error: "Pick at least one day." }, { status: 400 });
  }

  try {
    const id = await addProtocol(tswKey(user), {
      peptide: d.peptide.trim(),
      doseMg: d.doseMg,
      schedule: {
        type: d.schedule.type,
        ...(d.schedule.type === "weekly" ? { days: [...new Set(d.schedule.days)] } : {}),
      },
      time: d.time ?? null,
      purpose: d.purpose ?? null,
      active: true,
    });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("Failed to save protocol:", err);
    return NextResponse.json(
      { error: "Couldn't save — the database isn't reachable yet." },
      { status: 503 }
    );
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  active: z.boolean(),
});

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  try {
    await setProtocolActive(tswKey(user), parsed.data.id, parsed.data.active);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to update protocol:", err);
    return NextResponse.json({ error: "Couldn't update the protocol." }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    await deleteProtocol(tswKey(user), id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete protocol:", err);
    return NextResponse.json({ error: "Couldn't delete the protocol." }, { status: 503 });
  }
}
