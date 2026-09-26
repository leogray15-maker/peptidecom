"use client";

import { cn } from "@/lib/utils";

const base =
  "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors duration-150 ease-out";

export function chipClass(selected: boolean, className?: string) {
  return cn(
    base,
    selected
      ? "border-primary bg-chip text-fg-active"
      : "border-line bg-transparent text-fg-secondary hover:border-line-strong hover:text-fg",
    className
  );
}

/** Toggleable chip. Exposes its state with aria-pressed. */
export function Chip({
  selected = false,
  onToggle,
  className,
  children,
  ...props
}: {
  selected?: boolean;
  onToggle?: () => void;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick">) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={chipClass(selected, className)}
      {...props}
    >
      {children}
    </button>
  );
}

/** Static, non-interactive tag. */
export function Tag({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-line px-2 py-0.5 text-[12px] font-medium text-fg-secondary",
        className
      )}
    >
      {children}
    </span>
  );
}
