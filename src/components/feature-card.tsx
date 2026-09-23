import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeatureBadge = "PRO" | "NEW" | "BETA" | "VALIDATED" | "EXPERIMENTAL" | null;

export interface FeatureCardProps {
  href: string;
  title: string;
  description: string;
  icon: React.ElementType;
  badge?: FeatureBadge;
  /** External links (opens in a new tab). */
  external?: boolean;
  className?: string;
}

// VALIDATED and EXPERIMENTAL are deliberately different families of colour,
// not two shades of the same one — the whole job of the pair is to be
// distinguishable at a glance.
const badgeClass: Record<NonNullable<FeatureBadge>, string> = {
  PRO: "border border-brand-400/40 bg-brand-400/15 text-brand-200",
  NEW: "border border-brand-500/40 bg-brand-500/15 text-brand-200",
  BETA: "border border-gold-500/40 bg-gold-500/10 text-gold-200",
  VALIDATED: "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  EXPERIMENTAL: "border border-gold-500/40 bg-gold-500/10 text-gold-200",
};

/** The badge pill on its own, for section headings that label a whole group. */
export function FeatureBadgePill({ badge, className }: { badge: NonNullable<FeatureBadge>; className?: string }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em]",
        badgeClass[badge],
        className
      )}
    >
      {badge}
    </span>
  );
}

/**
 * Clean, tappable feature row — icon tile · title (+ badge) · description ·
 * chevron. Modelled on the reference App Store screenshots but in the Arcane
 * violet palette. One card style used across the dashboard and tool hubs so the
 * whole app reads as one system.
 */
export function FeatureCard({
  href,
  title,
  description,
  icon: Icon,
  badge = null,
  external = false,
  className,
}: FeatureCardProps) {
  const inner = (
    <>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-300 transition group-hover:bg-brand-500/20 group-hover:text-brand-200">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-semibold text-white">{title}</p>
          {badge && <FeatureBadgePill badge={badge} />}
        </div>
        <p className="mt-1 text-sm leading-snug text-slate-400">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 self-center text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-brand-300" />
    </>
  );

  const classes = cn(
    "card group flex items-start gap-4 !p-4 transition hover:border-brand-500/50 hover:bg-lab-raised/60 sm:!p-5",
    className
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {inner}
    </Link>
  );
}
