import { cn } from "@/lib/utils";

/** Empty / error state: icon, one line of context, one clear next action. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  tone = "neutral",
  className,
}: {
  icon?: React.ElementType;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  tone?: "neutral" | "error";
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-line px-6 py-10 text-center",
        className
      )}
    >
      {Icon && (
        <span
          className={cn(
            "mb-3 grid h-10 w-10 place-items-center rounded-control border border-line bg-surface-active",
            tone === "error" ? "text-score-bad" : "text-accent-strong"
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </span>
      )}
      <p className="text-[14.5px] font-semibold text-fg">{title}</p>
      {body && <p className="mt-1 max-w-sm text-meta text-fg-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Inline error for a data view that failed to load. */
export function ErrorState({
  title = "Couldn't load this",
  body = "Check your connection and try again.",
  onRetry,
  className,
}: {
  title?: string;
  body?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-card border border-score-bad/40 bg-score-bad/5 px-4 py-3",
        className
      )}
    >
      <div>
        <p className="text-sm font-semibold text-fg">{title}</p>
        <p className="text-meta text-fg-secondary">{body}</p>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary min-h-11 sm:min-h-9 px-3 text-[13px]">
          Try again
        </button>
      )}
    </div>
  );
}
