import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMember } from "@/lib/api-auth";
import { ITCH_ACTIONS } from "@/lib/tsw";
import { addItchLog, deleteItchLog, logFunnel, tswKey } from "@/lib/tsw-db";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  at: z.string().datetime().optional(),
  level: z.number().int().min(0).max(10),
  note: z.string().max(500).optional().nullable(),
  action: z
    .enum(ITCH_ACTIONS.map((a) => a.id) as [string, ...string[]])
    .optional()
    .nullable(),
});

export async function POST(req: Request) {
  const gate = await requireMember();
  if (gate.error) return gate.error;
  const user = gate.user;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const uid = tswKey(user);
  const { date, level, note, action } = parsed.data;
  try {
    const id = await addItchLog(uid, {
      date,
      at: parsed.data.at ?? new Date().toISOString(),
      level,
      note: note?.trim() || null,
      action: action ?? null,
    });
    // Instrumentation is best-effort inside logFunnel — never blocks the save.
    await logFunnel(uid, "itch_logged", { level });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("Failed to save itch check-in:", err);
    return NextResponse.json(
      { error: "Couldn't save — the database isn't reachable yet." },
      { status: 503 }
    );
  }
}

export async function DELETE(req: Request) {
  const gate = await requireMember();
  if (gate.error) return gate.error;
  const user = gate.user;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    await deleteItchLog(tswKey(user), id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete itch check-in:", err);
    return NextResponse.json({ error: "Couldn't delete that check-in." }, { status: 503 });
  }
}
