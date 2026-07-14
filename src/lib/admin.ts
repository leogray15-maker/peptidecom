import "server-only";
import { NextResponse } from "next/server";
import type { LifecycleStage, SubscriptionStatus, User } from "@prisma/client";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Shared helpers for the admin CRM: gating, audit logging and the customer
 * lifecycle model. Everything here is server-only. */

export type AdminUser = User;

/** The signed-in user when they're an admin (role or allow-listed email), else null. */
export async function getAdminUser(): Promise<AdminUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role === "ADMIN" || isAdminEmail(user.email)) return user;
  return null;
}

/** API-route guard: returns the admin user, or a ready-to-return 401/403 response. */
export async function requireAdminApi(): Promise<
  { admin: AdminUser; error: null } | { admin: null; error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { admin: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== "ADMIN" && !isAdminEmail(user.email)) {
    return { admin: null, error: NextResponse.json({ error: "Admins only" }, { status: 403 }) };
  }
  return { admin: user, error: null };
}

/** Best-effort audit trail — a failed log must never fail the action itself. */
export async function logActivity(entry: {
  actorEmail: string;
  action: string;
  detail?: string;
  userId?: string | null;
}) {
  try {
    await prisma.crmActivity.create({
      data: {
        actorEmail: entry.actorEmail,
        action: entry.action,
        detail: entry.detail,
        userId: entry.userId ?? undefined,
      },
    });
  } catch (err) {
    console.error("logActivity failed:", err);
  }
}

// ─── Lifecycle stages ─────────────────────────────────────────────────────────

export const STAGES: LifecycleStage[] = ["LEAD", "TRIAL", "ACTIVE", "AT_RISK", "CHURNED", "VIP"];

export const STAGE_LABEL: Record<LifecycleStage, string> = {
  LEAD: "Lead",
  TRIAL: "Trial",
  ACTIVE: "Active",
  AT_RISK: "At risk",
  CHURNED: "Churned",
  VIP: "VIP",
};

/** Derive a stage from billing state; a manual crmStage always wins. */
export function lifecycleStage(user: {
  crmStage: LifecycleStage | null;
  subscriptionStatus: SubscriptionStatus;
}): LifecycleStage {
  if (user.crmStage) return user.crmStage;
  switch (user.subscriptionStatus) {
    case "ACTIVE":
      return "ACTIVE";
    case "TRIALING":
      return "TRIAL";
    case "PAST_DUE":
      return "AT_RISK";
    case "CANCELED":
      return "CHURNED";
    default:
      return "LEAD";
  }
}

/** Human labels for audit-log action keys; unknown keys fall back to the key. */
export const ACTION_LABEL: Record<string, string> = {
  "customer.updated": "Updated customer",
  "customer.role_changed": "Changed role",
  "customer.stage_changed": "Changed lifecycle stage",
  "customer.tags_changed": "Updated tags",
  "customer.verified_changed": "Toggled verified badge",
  "customer.contacted": "Marked as contacted",
  "note.created": "Added a note",
  "note.pinned": "Pinned a note",
  "note.unpinned": "Unpinned a note",
  "note.deleted": "Deleted a note",
  "task.created": "Created a task",
  "task.completed": "Completed a task",
  "task.reopened": "Reopened a task",
  "task.updated": "Updated a task",
  "task.deleted": "Deleted a task",
  "customers.exported": "Exported customers CSV",
};
