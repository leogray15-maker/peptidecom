import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-control bg-surface-active", className)} />;
}

/** Card-shaped placeholder while a data view loads. */
export function CardSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("card space-y-3", className)} aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading page">
      <Skeleton className="mb-3 h-3 w-24" />
      <Skeleton className="mb-8 h-10 w-72 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <CardSkeleton key={i} lines={1} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <CardSkeleton lines={6} className="lg:col-span-2" />
        <CardSkeleton lines={6} />
      </div>
    </div>
  );
}
