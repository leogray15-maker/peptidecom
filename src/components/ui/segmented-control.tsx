"use client";

import { cn } from "@/lib/utils";

/** Pill-in-a-track toggle between a few mutually exclusive options. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  className,
}: {
  options: readonly { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  /** Accessible name for the group. */
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-control border border-line bg-surface-sunken p-0.5",
        className
      )}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-[7px] px-3 font-medium transition-colors duration-150 ease-out",
              size === "sm" ? "min-h-7 text-[12.5px]" : "min-h-8 text-[13px]",
              on ? "bg-surface-active text-fg-active" : "text-fg-muted hover:text-fg"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
