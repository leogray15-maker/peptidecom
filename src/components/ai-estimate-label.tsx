import { Info, ShieldAlert } from "lucide-react";
import { AI_ESTIMATE_LABEL } from "@/lib/ai-grading";
import { cn } from "@/lib/utils";

/**
 * The persistent "AI estimate — not a diagnosis" label.
 *
 * Deliberately has no dismiss affordance and no `hidden` prop: every surface
 * that shows an AI-graded number renders this, and there is no code path that
 * turns it off. The BETA badge is a supporting signal — this is the disclosure.
 */
export function AiEstimateLabel({
  size = "md",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-gold-500/40 bg-gold-500/10 font-semibold text-gold-200",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <ShieldAlert className={size === "sm" ? "h-3 w-3 shrink-0" : "h-3.5 w-3.5 shrink-0"} />
      {AI_ESTIMATE_LABEL}
    </p>
  );
}

/** "About this estimate" — model attributability, in the detail view. */
export function AboutThisEstimate({
  modelId,
  method,
  consentVersion,
  gradedAt,
}: {
  modelId: string | null;
  method: string;
  consentVersion: number | null;
  gradedAt?: string | null;
}) {
  const rows: [string, string][] = [
    ["Method", method],
    ["Model", modelId ?? "Not recorded (graded before model IDs were stored)"],
    ["Disclaimer version", consentVersion != null ? `v${consentVersion}` : "Not recorded"],
  ];
  if (gradedAt) rows.push(["Graded", gradedAt]);

  return (
    <div className="rounded-2xl border border-lab-border bg-lab-bg/60 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-white">
        <Info className="h-4 w-4 text-brand-300" /> About this estimate
      </p>
      <dl className="mt-3 space-y-1.5">
        {rows.map(([term, value]) => (
          <div key={term} className="flex items-start justify-between gap-4 text-xs">
            <dt className="shrink-0 text-slate-500">{term}</dt>
            <dd className="text-right font-medium text-slate-300">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        The model identifier is stored with the result so an old estimate stays attributable to
        the version that produced it, even after the maths changes.
      </p>
    </div>
  );
}
