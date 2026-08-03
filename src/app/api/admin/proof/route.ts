import { NextResponse } from "next/server";
import { z } from "zod";
import { logActivity, requireAdminApi } from "@/lib/admin";
import { CONDITION_IDS } from "@/lib/conditions";
import { createProofRecord, reorderProofRecords } from "@/lib/proof-db";

export const runtime = "nodejs";

const createSchema = z.object({
  /** First name only — the public wall never carries a full name. */
  name: z.string().trim().min(1).max(40),
  condition: z.enum(CONDITION_IDS),
  quote: z.string().trim().min(1).max(4000),
  highlight: z.string().trim().max(300).optional().nullable(),
  timeframe: z.string().trim().max(120).optional().nullable(),
  consentedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  consentNote: z.string().trim().max(500).optional().nullable(),
});

/** Add a piece of proof collected outside the app — a DM, a message, a review.
 * It lands as a draft: publishing to the public site is a separate approval,
 * and one that needs a consent date on the record. */
export async function POST(req: Request) {
  const { admin, error } = await requireAdminApi();
  if (error) return error;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  try {
    const id = await createProofRecord(parsed.data, admin.email);
    await logActivity({
      actorEmail: admin.email,
      action: "proof.created",
      detail: parsed.data.name,
    });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("Failed to create proof entry:", err);
    return NextResponse.json({ error: "Couldn't save that entry." }, { status: 503 });
  }
}

const reorderSchema = z.object({
  entries: z
    .array(
      z.object({
        source: z.enum(["custom", "curated", "story"]),
        sourceId: z.string().min(1).max(200),
      })
    )
    .max(200),
});

/** Rewrite the wall's running order. The client sends the full list it just
 * rearranged, so what the admin sees is exactly what the site renders. */
export async function PUT(req: Request) {
  const { admin, error } = await requireAdminApi();
  if (error) return error;

  const parsed = reorderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  try {
    await reorderProofRecords(parsed.data.entries, admin.email);
    await logActivity({ actorEmail: admin.email, action: "proof.reordered" });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to reorder the proof wall:", err);
    return NextResponse.json({ error: "Couldn't save the new order." }, { status: 503 });
  }
}
