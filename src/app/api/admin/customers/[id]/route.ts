import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logActivity, requireAdminApi, STAGE_LABEL } from "@/lib/admin";
import { syncMembershipClaim } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  role: z.enum(["MEMBER", "MODERATOR", "ADMIN"]).optional(),
  verified: z.boolean().optional(),
  comped: z.boolean().optional(), // free access without a Stripe sub
  crmStage: z.enum(["LEAD", "TRIAL", "ACTIVE", "AT_RISK", "CHURNED", "VIP"]).nullable().optional(),
  crmTags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  contacted: z.literal(true).optional(), // stamps lastContactedAt = now
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { admin, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await ctx.params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }
  const input = parsed.data;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  // Safety rail: an admin can't demote their own account and lock themselves out.
  if (input.role && input.role !== "ADMIN" && target.id === admin.id) {
    return NextResponse.json({ error: "You can't remove your own admin role." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(input.role !== undefined && { role: input.role }),
      ...(input.verified !== undefined && { verified: input.verified }),
      ...(input.comped !== undefined && { comped: input.comped }),
      ...(input.crmStage !== undefined && { crmStage: input.crmStage }),
      ...(input.crmTags !== undefined && {
        crmTags: [...new Set(input.crmTags.map((t) => t.toLowerCase()))],
      }),
      ...(input.contacted && { lastContactedAt: new Date() }),
    },
  });

  // Keep Firestore security-rule claims in step with role/access changes.
  if ((input.role !== undefined || input.comped !== undefined) && user.firebaseUid) {
    await syncMembershipClaim(user.firebaseUid, user.subscriptionStatus, user.role, user.comped);
  }

  const changes: { action: string; detail: string }[] = [];
  if (input.role !== undefined && input.role !== target.role)
    changes.push({ action: "customer.role_changed", detail: `${target.role} → ${input.role}` });
  if (input.verified !== undefined && input.verified !== target.verified)
    changes.push({ action: "customer.verified_changed", detail: input.verified ? "verified" : "unverified" });
  if (input.comped !== undefined && input.comped !== target.comped)
    changes.push({ action: "customer.comp_changed", detail: input.comped ? "granted free access" : "revoked free access" });
  if (input.crmStage !== undefined && input.crmStage !== target.crmStage)
    changes.push({
      action: "customer.stage_changed",
      detail: input.crmStage ? STAGE_LABEL[input.crmStage] : "auto (from billing)",
    });
  if (input.crmTags !== undefined)
    changes.push({ action: "customer.tags_changed", detail: user.crmTags.join(", ") || "cleared" });
  if (input.contacted) changes.push({ action: "customer.contacted", detail: "" });

  for (const c of changes) {
    await logActivity({ actorEmail: admin.email, userId: id, action: c.action, detail: c.detail || undefined });
  }

  return NextResponse.json({ ok: true });
}
