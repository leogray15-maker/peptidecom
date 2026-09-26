import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(d);
}

export function timeAgo(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  const intervals: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.34524, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];
  let count = seconds;
  let unit = "second";
  let acc = 1;
  for (const [step, name] of intervals) {
    if (count < step) {
      unit = name;
      break;
    }
    acc *= step;
    count = seconds / acc;
    unit = name;
  }
  const value = Math.floor(count);
  if (value <= 0) return "just now";
  return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
}

export function initials(name?: string | null) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Normalise a title to sentence case ("HOW TO HEAL YOUR GUT" / "How To Heal
 * Your Gut" → "How to heal your gut"). Words that are all caps in an
 * otherwise mixed-case title (acronyms like EASI, UV, NAD+) are kept.
 */
export function sentenceCase(title: string): string {
  const trimmed = title.trim().replace(/\.$/, "");
  const letters = trimmed.replace(/[^A-Za-z]/g, "");
  const shouting = letters.length > 0 && letters === letters.toUpperCase();
  const words = trimmed.split(/(\s+)/);
  let first = true;
  return words
    .map((w) => {
      if (/^\s+$/.test(w) || !/[A-Za-z]/.test(w)) return w;
      const isAcronym = !shouting && w.length > 1 && /^[^a-z]*[A-Z][^a-z]*$/.test(w);
      let out = isAcronym ? w : w.toLowerCase();
      if (/^i(['’]|$)/.test(out)) out = "I" + out.slice(1);
      if (first) {
        out = out.replace(/[A-Za-z]/, (c) => c.toUpperCase());
        first = false;
      }
      return out;
    })
    .join("");
}
