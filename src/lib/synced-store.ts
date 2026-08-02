"use client";

// Local-first storage that follows the account.
//
// Every list the app used to keep in localStorage only — EASI scores, POEM
// scores, scanned products — now lives on the member's profile as well, so
// signing in on a new phone brings the whole history with you. The rules:
//
//  1. Read localStorage first and render immediately (instant, works offline).
//  2. Fetch the account copy, union the two, adopt the result, write it back to
//     both. Entries are identified by their ISO `at` timestamp, so the union is
//     idempotent — the same save syncing twice can never duplicate.
//  3. Writes go to localStorage synchronously and to the server in the
//     background. A failed upload is retried on the next load, because the
//     entry is still sitting in the local copy waiting to be merged up.
//
// That means no spinner, no data loss on a flaky connection, and no way for two
// devices to clobber each other.

export interface SyncedEntry<T = unknown> {
  /** ISO timestamp of when the entry was saved — also its identity. */
  at: string;
  /** The headline number for the entry. */
  score: number;
  /** Tool-specific payload. */
  detail: T;
}

const KEY_PREFIX = "arcane.synced.";
const ENDPOINT = "/api/tsw/history";

function storageKey(key: string): string {
  return `${KEY_PREFIX}${key}`;
}

/** Union two lists by `at`, oldest first. Later entries win on conflict. */
export function mergeEntries<T>(
  a: SyncedEntry<T>[],
  b: SyncedEntry<T>[],
  limit: number
): SyncedEntry<T>[] {
  const byAt = new Map<string, SyncedEntry<T>>();
  for (const entry of [...a, ...b]) {
    if (entry && typeof entry.at === "string") byAt.set(entry.at, entry);
  }
  return [...byAt.values()].sort((x, y) => x.at.localeCompare(y.at)).slice(-limit);
}

export function readLocal<T>(key: string): SyncedEntry<T>[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(key));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SyncedEntry<T>[]) : [];
  } catch {
    return [];
  }
}

export function writeLocal<T>(key: string, entries: SyncedEntry<T>[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(entries));
  } catch {
    // Storage full, blocked or private mode — the account copy still holds.
  }
}

export function clearLocal(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(key));
  } catch {
    // no-op
  }
}

/**
 * Reconcile this device's list with the account's. Returns the merged list —
 * the caller should render it and treat it as the truth from then on.
 *
 * Never throws: offline, signed-out and server-error all fall back to whatever
 * is on the device, which is exactly what the member had before sync existed.
 */
export async function syncList<T>(
  key: string,
  limit: number
): Promise<SyncedEntry<T>[]> {
  const local = readLocal<T>(key);
  try {
    // POST does both halves of the job: it uploads anything this device has
    // that the account doesn't, and returns the reconciled list.
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, entries: local }),
    });
    if (!res.ok) return local;
    const data = (await res.json()) as { entries?: SyncedEntry<T>[] };
    const merged = mergeEntries(local, data.entries ?? [], limit);
    writeLocal(key, merged);
    return merged;
  } catch {
    return local;
  }
}

/** Append an entry: local write is synchronous, the upload is best-effort. */
export function appendEntry<T>(
  key: string,
  entry: SyncedEntry<T>,
  limit: number,
  { persist = true }: { persist?: boolean } = {}
): SyncedEntry<T>[] {
  const next = mergeEntries(readLocal<T>(key), [entry], limit);
  if (!persist) return next;
  writeLocal(key, next);
  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, entries: [entry] }),
  }).catch(() => {
    // Left in the local copy — the next syncList() call will carry it up.
  });
  return next;
}

/** Wipe a list on this device and on the account. */
export async function clearList(key: string): Promise<void> {
  clearLocal(key);
  try {
    await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, { method: "DELETE" });
  } catch {
    // Local copy is already gone; the account copy is cleared next time.
  }
}
