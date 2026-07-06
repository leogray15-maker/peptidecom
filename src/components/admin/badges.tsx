import type { LifecycleStage, Role, SubscriptionStatus, CrmTaskPriority } from "@prisma/client";
import { cn } from "@/lib/utils";

/** Small presentational badges shared across the admin CRM. Server-safe. */

const STAGE_STYLE: Record<LifecycleStage, string> = {
  LEAD: "bg-slate-500/15 text-slate-300",
  TRIAL: "bg-sky-500/15 text-sky-300",
  ACTIVE: "bg-emerald-500/15 text-emerald-300",
  AT_RISK: "bg-amber-500/15 text-amber-300",
  CHURNED: "bg-rose-500/15 text-rose-300",
  VIP: "bg-gold-500/15 text-gold-300",
};

const STAGE_TEXT: Record<LifecycleStage, string> = {
  LEAD: "Lead",
  TRIAL: "Trial",
  ACTIVE: "Active",
  AT_RISK: "At risk",
  CHURNED: "Churned",
  VIP: "VIP",
};

export function StageBadge({ stage, manual }: { stage: LifecycleStage; manual?: boolean }) {
  return (
    <span className={cn("badge", STAGE_STYLE[stage])} title={manual ? "Manually set" : "Derived from billing"}>
      {STAGE_TEXT[stage]}
      {manual && <span aria-hidden>•</span>}
    </span>
  );
}

const STATUS_STYLE: Record<SubscriptionStatus, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-300",
  TRIALING: "bg-sky-500/15 text-sky-300",
  PAST_DUE: "bg-amber-500/15 text-amber-300",
  CANCELED: "bg-rose-500/15 text-rose-300",
  INCOMPLETE: "bg-slate-500/15 text-slate-400",
  NONE: "bg-slate-500/15 text-slate-400",
};

const STATUS_TEXT: Record<SubscriptionStatus, string> = {
  ACTIVE: "Active",
  TRIALING: "Trialing",
  PAST_DUE: "Past due",
  CANCELED: "Canceled",
  INCOMPLETE: "Incomplete",
  NONE: "Free",
};

export function SubscriptionBadge({ status }: { status: SubscriptionStatus }) {
  return <span className={cn("badge", STATUS_STYLE[status])}>{STATUS_TEXT[status]}</span>;
}

/** Admin-granted free membership (no Stripe sub). */
export function CompBadge() {
  return <span className="badge bg-emerald-500/15 text-emerald-300">Free access</span>;
}

export function RoleBadge({ role }: { role: Role }) {
  if (role === "MEMBER") return null;
  return (
    <span
      className={cn(
        "badge",
        role === "ADMIN" ? "bg-brand-500/20 text-brand-200" : "bg-brand-500/10 text-brand-300"
      )}
    >
      {role === "ADMIN" ? "Admin" : "Moderator"}
    </span>
  );
}

export function TagBadge({ tag }: { tag: string }) {
  return <span className="badge border border-lab-border bg-white/5 text-slate-300">{tag}</span>;
}

const PRIORITY_STYLE: Record<CrmTaskPriority, string> = {
  LOW: "bg-slate-500/15 text-slate-400",
  MEDIUM: "bg-sky-500/15 text-sky-300",
  HIGH: "bg-amber-500/15 text-amber-300",
  URGENT: "bg-rose-500/15 text-rose-300",
};

export function PriorityBadge({ priority }: { priority: CrmTaskPriority }) {
  const label = priority.charAt(0) + priority.slice(1).toLowerCase();
  return <span className={cn("badge", PRIORITY_STYLE[priority])}>{label}</span>;
}
