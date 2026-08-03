import { NextResponse } from "next/server";
import { z } from "zod";
import { logActivity, requireAdminApi } from "@/lib/admin";
import { PROOF_IMAGE_MAX_CHARS, proofRecordId } from "@/lib/proof";
import { ProofConsentError, addProofImage, deleteProofImage } from "@/lib/proof-db";

export const runtime = "nodejs";

const seedSchema = z.object({
  source: z.enum(["custom", "curated", "story"]),
  sourceId: z.string().min(1).max(200),
});

// Photos are compressed in the browser and stored as data-URLs, one Firestore
// document each. The cap sits well below the 1MB document limit.
const postSchema = z.object({
  seed: seedSchema.optional(),
  src: z
    .string()
    .max(PROOF_IMAGE_MAX_CHARS)
    .regex(/^data:image\/(jpeg|png|webp);base64,/),
  /** Described for screen readers — the wall is a public page. */
  alt: z.string().trim().min(1).max(300),
  caption: z.string().trim().max(160).nullable().optional(),
  kind: z.enum(["photo", "screenshot"]).optional(),
});

/** Attach a photo to an entry. This is what fixes a curated testimonial whose
 * image files were never dropped into /public: upload them here and the wall
 * uses these instead, with no deploy involved. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { admin, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await ctx.params;
  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "That image didn't fit — try a smaller one." },
      { status: 400 }
    );
  }
  const { seed, ...image } = parsed.data;
  if (seed && proofRecordId(seed.source, seed.sourceId) !== id) {
    return NextResponse.json({ error: "Entry id doesn't match." }, { status: 400 });
  }
  // A member's story publishes the member's own consented before/after and
  // nothing else. The panel hides the control; this is the backstop that means
  // no request can attach a picture they never agreed to publish.
  if (seed?.source === "story" || id.startsWith("story__")) {
    return NextResponse.json(
      {
        error:
          "A member story only ever shows the photos that member consented to. Add a separate entry instead.",
      },
      { status: 400 }
    );
  }

  try {
    const imageId = await addProofImage(id, image, admin.email, seed);
    await logActivity({ actorEmail: admin.email, action: "proof.photo_added", detail: id });
    return NextResponse.json({ ok: true, id: imageId });
  } catch (err) {
    if (err instanceof ProofConsentError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Failed to add proof photo:", err);
    return NextResponse.json({ error: "Couldn't save that photo." }, { status: 503 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { admin, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await ctx.params;
  const imageId = new URL(req.url).searchParams.get("imageId");
  if (!imageId) return NextResponse.json({ error: "Missing imageId" }, { status: 400 });

  try {
    await deleteProofImage(id, imageId);
    await logActivity({ actorEmail: admin.email, action: "proof.photo_removed", detail: id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to remove proof photo:", err);
    return NextResponse.json({ error: "Couldn't remove that photo." }, { status: 503 });
  }
}
