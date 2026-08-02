"use client";

// History for the self-assessment tools (EASI, POEM).
//
// These scores used to live in this browser's localStorage and nowhere else,
// which meant a member who changed phone lost every number they'd recorded.
// They now save to the member's own profile as well, and the two copies are
// reconciled on load — so the history is the same on every device you sign in
// on, and still works offline on the device you're holding.
//
// The calculators themselves are unchanged: the maths still runs entirely in
// the browser, and nothing is sent anywhere unless the member presses Save.
// Turning "save tool history" off in Privacy & Sources stops both copies.

import { getConsent } from "@/lib/consent";
import {
  type SyncedEntry,
  appendEntry,
  clearList,
  readLocal,
  syncList,
  writeLocal,
} from "@/lib/synced-store";

export type HistoryEntry<T> = SyncedEntry<T>;

const MAX_ENTRIES = 60;

/** Pre-sync localStorage key, kept so existing members' scores carry over. */
const LEGACY_PREFIX = "arcane.tool.";

/** Fold any pre-sync local history into the synced store, once. */
function migrateLegacy(tool: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LEGACY_PREFIX + tool);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const merged = [...readLocal(tool), ...parsed]
        .filter((e) => e && typeof e.at === "string")
        .sort((a, b) => a.at.localeCompare(b.at))
        .slice(-MAX_ENTRIES);
      writeLocal(tool, merged);
    }
    window.localStorage.removeItem(LEGACY_PREFIX + tool);
  } catch {
    // A malformed legacy blob is not worth breaking the tool over.
  }
}

/** Instant, synchronous read of this device's copy — for first paint. */
export function loadHistory<T>(tool: string): HistoryEntry<T>[] {
  migrateLegacy(tool);
  return readLocal<T>(tool);
}

/** Reconcile with the account copy. Falls back to the local list when the
 * member is offline or signed out. */
export async function syncHistory<T>(tool: string): Promise<HistoryEntry<T>[]> {
  migrateLegacy(tool);
  if (!getConsent("toolHistory")) return readLocal<T>(tool);
  return syncList<T>(tool, MAX_ENTRIES);
}

/** Save a score. Returns the updated list straight away — the upload happens
 * in the background and retries itself on the next sync. */
export function appendHistory<T>(tool: string, entry: HistoryEntry<T>): HistoryEntry<T>[] {
  return appendEntry<T>(tool, entry, MAX_ENTRIES, { persist: getConsent("toolHistory") });
}

/** Wipe this tool's history everywhere — this device and the account. */
export async function clearHistory(tool: string): Promise<void> {
  await clearList(tool);
}
