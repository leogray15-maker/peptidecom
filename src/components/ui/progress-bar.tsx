import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max = 100,
  label,
  color,
  className,
}: {
  value: number;
  max?: number;
  /** Accessible name. */
  label: string;
  /** Fill colour; defaults to the accent. */
  color?: string;
  className?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-active", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-200 ease-out", !color && "bg-accent")}
        style={{ width: `${pct}%`, ...(color ? { backgroundColor: color } : {}) }}
      />
    </div>
  );
}
