import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { addPeptideLog, deletePeptideLog, tswKey } from "@/lib/tsw-db";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  peptide: z.string().min(1).max(80),
  doseMg: z.number().positive().max(1000),
  note: z.string().max(1000).optional().nullable(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  try {
    const id = await addPeptideLog(tswKey(user), {
      ...parsed.data,
      peptide: parsed.data.peptide.trim(),
      note: parsed.data.note ?? null,
    });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("Failed to save peptide log:", err);
    return NextResponse.json(
      { error: "Couldn't save — the database isn't reachable yet." },
      { status: 503 }
    );
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    await deletePeptideLog(tswKey(user), id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete peptide log:", err);
    return NextResponse.json({ error: "Couldn't delete the entry." }, { status: 503 });
  }
}
