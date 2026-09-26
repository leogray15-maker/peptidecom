import { cn } from "@/lib/utils";

/**
 * One headline number. `value` renders in Geist Mono with tabular figures;
 * `tone` optionally colours a small dot beside the label (always paired with
 * the number, never colour alone).
 */
export function StatCard({
  label,
  value,
  unit,
  meta,
  delta,
  icon: Icon,
  dotColor,
  className,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  meta?: React.ReactNode;
  /** e.g. { text: "−0.8 vs last week", good: true } */
  delta?: { text: string; good?: boolean | null };
  icon?: React.ElementType;
  dotColor?: string;
  className?: string;
}) {
  return (
    <div className={cn("card flex min-w-0 flex-col gap-3 !p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="section-label truncate">{label}</p>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-accent-strong" strokeWidth={1.75} aria-hidden />}
      </div>
      <p className="flex items-baseline gap-1.5">
        {dotColor && (
          <span
            className="mb-1 inline-block h-2 w-2 shrink-0 self-center rounded-full"
            style={{ backgroundColor: dotColor }}
            aria-hidden
          />
        )}
        <span className="stat-num text-[28px]">{value}</span>
        {unit && <span className="font-mono text-meta text-fg-muted">{unit}</span>}
      </p>
      {(meta || delta) && (
        <p className="text-meta text-fg-muted">
          {delta && (
            <span
              className={cn(
                "mr-1.5 font-mono tabular-nums",
                delta.good === true && "text-score-excellent",
                delta.good === false && "text-score-bad"
              )}
            >
              {delta.text}
            </span>
          )}
          {meta}
        </p>
      )}
    </div>
  );
}
