import { NextResponse } from "next/server";
import { z } from "zod";
import { logActivity, requireAdminApi } from "@/lib/admin";
import { setStoryStatus } from "@/lib/tsw-db";

export const runtime = "nodejs";

const patchSchema = z.object({
  status: z.enum(["new", "approved", "posted", "skipped"]),
});

/** Triage a story in the content pipeline (new → approved → posted / skipped). */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { admin, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  try {
    await setStoryStatus(id, parsed.data.status);
    await logActivity({
      actorEmail: admin.email,
      action: `story.${parsed.data.status}`,
      detail: id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to update story status:", err);
    return NextResponse.json({ error: "Couldn't update the story." }, { status: 503 });
  }
}
