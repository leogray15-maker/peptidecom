import { cn } from "@/lib/utils";

/** The one quiet disclaimer line at the bottom of every page. */
export function DisclaimerLine({ className }: { className?: string }) {
  return (
    <p className={cn("text-meta text-fg-muted", className)}>
      Peer support &amp; education community · Not medical advice
    </p>
  );
}
