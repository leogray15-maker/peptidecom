import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeatureBadge = "PRO" | "NEW" | "BETA" | null;

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

const badgeClass: Record<NonNullable<FeatureBadge>, string> = {
  PRO: "border border-brand-400/40 bg-brand-400/15 text-brand-200",
  NEW: "border border-brand-500/40 bg-brand-500/15 text-brand-200",
  BETA: "border border-gold-500/40 bg-gold-500/10 text-gold-200",
};

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
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-500/12 text-brand-300 ring-1 ring-inset ring-brand-500/20 transition group-hover:bg-brand-500/20 group-hover:text-brand-200">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-white">{title}</p>
          {badge && (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                badgeClass[badge]
              )}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm leading-snug text-slate-400">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 self-center text-slate-600 transition group-hover:text-brand-300" />
    </>
  );

  const classes = cn(
    "card group flex items-start gap-4 !rounded-3xl transition hover:border-brand-500/60 hover:bg-lab-card/80",
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
