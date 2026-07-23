"use client";

// Lightweight, on-device history for the self-assessment tools (EASI, POEM).
//
// These scores are kept in the browser's localStorage only — they never leave
// the device and are not synced to the account. That keeps the tools fully
// offline and private, and avoids sending health scores to a server. The UI
// says so plainly. If cloud sync is ever wanted it can be layered on top
// without changing the calculators themselves.

import { getConsent } from "@/lib/consent";

export interface HistoryEntry<T> {
  /** ISO timestamp of when the entry was saved. */
  at: string;
  /** The computed headline score. */
  score: number;
  /** Tool-specific detail payload (inputs, band, etc.). */
  detail: T;
}

const KEY_PREFIX = "arcane.tool.";
const MAX_ENTRIES = 60;

function keyFor(tool: string): string {
  return `${KEY_PREFIX}${tool}`;
}

export function loadHistory<T>(tool: string): HistoryEntry<T>[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(keyFor(tool));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry<T>[]) : [];
  } catch {
    return [];
  }
}

export function saveHistory<T>(tool: string, entries: HistoryEntry<T>[]): void {
  if (typeof window === "undefined") return;
  // Respect the on-device "save tool history" consent (Privacy & Sources).
  if (!getConsent("toolHistory")) return;
  try {
    window.localStorage.setItem(keyFor(tool), JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    // Storage full or blocked — the tool still works, just without history.
  }
}

export function appendHistory<T>(
  tool: string,
  entry: HistoryEntry<T>
): HistoryEntry<T>[] {
  const next = [...loadHistory<T>(tool), entry].slice(-MAX_ENTRIES);
  saveHistory(tool, next);
  return next;
}

export function clearHistory(tool: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(keyFor(tool));
  } catch {
    // no-op
  }
}
