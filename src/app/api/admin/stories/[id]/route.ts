import { NextResponse } from "next/server";
import { z } from "zod";
import { logActivity, requireAdminApi } from "@/lib/admin";
import { ConsentError, setStoryFeatured, setStoryStatus } from "@/lib/tsw-db";

export const runtime = "nodejs";

const patchSchema = z
  .object({
    status: z.enum(["new", "approved", "posted", "skipped"]).optional(),
    /** Show this story on the public sales pages (/, /pricing, /results). */
    featured: z.boolean().optional(),
  })
  .refine((v) => v.status !== undefined || v.featured !== undefined, {
    message: "Nothing to update.",
  });

/** Triage a story in the content pipeline (new → approved → posted / skipped),
 * and control whether it appears on the public results wall. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { admin, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }
  const { status, featured } = parsed.data;

  try {
    if (status !== undefined) {
      await setStoryStatus(id, status);
      await logActivity({ actorEmail: admin.email, action: `story.${status}`, detail: id });
    }
    if (featured !== undefined) {
      await setStoryFeatured(id, featured);
      await logActivity({
        actorEmail: admin.email,
        action: `story.${featured ? "featured" : "unfeatured"}`,
        detail: id,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    // A consent refusal is the admin asking for something the member didn't
    // agree to — say so plainly instead of reporting a server fault.
    if (err instanceof ConsentError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Failed to update story:", err);
    return NextResponse.json({ error: "Couldn't update the story." }, { status: 503 });
  }
}
