import { NextResponse } from "next/server";
import { z } from "zod";
import { logActivity, requireAdminApi } from "@/lib/admin";
import { CONDITION_IDS } from "@/lib/conditions";
import { proofRecordId } from "@/lib/proof";
import {
  ProofConsentError,
  deleteProofRecord,
  getProofRecord,
  updateProofRecord,
} from "@/lib/proof-db";

export const runtime = "nodejs";

/** Curated and story entries have no document until the CRM first acts on
 * one, so the client says which entry it means and the server writes the
 * overlay on demand. */
const seedSchema = z.object({
  source: z.enum(["custom", "curated", "story"]),
  sourceId: z.string().min(1).max(200),
});

const patchSchema = z.object({
  seed: seedSchema.optional(),
  name: z.string().trim().min(1).max(40).optional(),
  condition: z.enum(CONDITION_IDS).optional(),
  quote: z.string().trim().min(1).max(4000).optional(),
  highlight: z.string().trim().max(300).nullable().optional(),
  timeframe: z.string().trim().max(120).nullable().optional(),
  consentedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  consentNote: z.string().trim().max(500).nullable().optional(),
  /** The approve button: live on the public site, or not. */
  published: z.boolean().optional(),
});

/** Edit an entry, or change whether (and where) it shows on the public site. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { admin, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }
  const { seed, ...patch } = parsed.data;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  // The id in the path has to be the one the seed describes, so a request
  // can't create an overlay pointing at a different entry than it names.
  if (seed && proofRecordId(seed.source, seed.sourceId) !== id) {
    return NextResponse.json({ error: "Entry id doesn't match." }, { status: 400 });
  }

  try {
    const record = await updateProofRecord(id, patch, admin.email, seed);
    if (patch.published !== undefined) {
      await logActivity({
        actorEmail: admin.email,
        action: patch.published ? "proof.published" : "proof.unpublished",
        detail: record.name ?? record.sourceId ?? id,
      });
    } else {
      await logActivity({
        actorEmail: admin.email,
        action: "proof.updated",
        detail: record.name ?? record.sourceId ?? id,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    // A consent refusal is the admin asking for something that isn't cleared
    // to be public — say so plainly instead of reporting a server fault.
    if (err instanceof ProofConsentError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Failed to update proof entry:", err);
    return NextResponse.json({ error: "Couldn't update that entry." }, { status: 503 });
  }
}

/** Delete a custom entry outright, or reset a curated/story entry back to its
 * defaults by dropping the overlay. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { admin, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await ctx.params;
  try {
    const record = await getProofRecord(id);
    if (!record) return NextResponse.json({ error: "Entry not found." }, { status: 404 });

    await deleteProofRecord(id);
    await logActivity({
      actorEmail: admin.email,
      action: record.source === "custom" ? "proof.deleted" : "proof.reset",
      detail: record.name ?? record.sourceId ?? id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete proof entry:", err);
    return NextResponse.json({ error: "Couldn't delete that entry." }, { status: 503 });
  }
}
