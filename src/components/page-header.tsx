import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Page header: mono eyebrow, Instrument Serif title (44px desktop), a one-line
 * subtitle and right-hand actions. Drill-in screens pass `back` for a quiet
 * back link above the eyebrow.
 */
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  action,
  actions,
  back,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Small mono label above the title (a date, a section name). */
  eyebrow?: React.ReactNode;
  /** Right-hand actions (buttons, a search box). */
  action?: React.ReactNode;
  actions?: React.ReactNode;
  /** Where the back link goes. Omit on top-level screens. */
  back?: string;
  className?: string;
}) {
  const right = actions ?? action;
  return (
    <header className={cn("mb-7 sm:mb-8", className)}>
      {back && (
        <Link
          href={back}
          className="-ml-1 mb-3 inline-flex min-h-11 sm:min-h-9 items-center gap-1 rounded-nav px-1 text-[13px] font-medium text-fg-muted transition-colors hover:text-fg"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Back
        </Link>
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h1 className="font-display text-[34px] font-normal leading-[1.05] tracking-[-0.01em] text-fg sm:text-page-title">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-fg-secondary">{subtitle}</p>
          )}
        </div>
        {right && <div className="flex shrink-0 flex-wrap items-center gap-2">{right}</div>}
      </div>
    </header>
  );
}
