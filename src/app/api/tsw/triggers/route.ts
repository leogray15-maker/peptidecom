import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMember } from "@/lib/api-auth";
import { TRIGGER_KINDS } from "@/lib/tsw";
import { addTrigger, deleteTrigger, logFunnel, tswKey } from "@/lib/tsw-db";

const entrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kind: z.enum(TRIGGER_KINDS.map((k) => k.id) as [string, ...string[]]),
  name: z.string().min(1).max(120),
  effect: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  note: z.string().max(1000).optional().nullable(),
});

/** One entry (the detailed form) or a batch (today's checklist) — the
 * checklist would otherwise fire a request per tick. */
const schema = z.union([entrySchema, z.object({ items: z.array(entrySchema).min(1).max(40) })]);

export async function POST(req: Request) {
  const gate = await requireMember();
  if (gate.error) return gate.error;
  const user = gate.user;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const uid = tswKey(user);
  const items = "items" in parsed.data ? parsed.data.items : [parsed.data];

  try {
    const ids = await Promise.all(
      items.map((item) => addTrigger(uid, { ...item, note: item.note ?? null }))
    );
    if (items.length > 1) await logFunnel(uid, "triggers_day_saved", { count: items.length });
    return NextResponse.json({ ok: true, ids, id: ids[0] });
  } catch (err) {
    console.error("Failed to save trigger:", err);
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
    await deleteTrigger(tswKey(user), id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete trigger:", err);
    return NextResponse.json({ error: "Couldn't delete the entry." }, { status: 503 });
  }
}
