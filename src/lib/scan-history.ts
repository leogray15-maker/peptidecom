"use client";

// History of scanned products, for the "History" list and the grading Overview.
//
// Like the EASI/POEM history this is local-first and account-synced: the device
// copy renders instantly and works offline, and the account copy means your
// scans are there when you sign in on another phone. Honours the same "save
// tool history" consent.

import { getConsent } from "@/lib/consent";
import {
  type SyncedEntry,
  appendEntry,
  clearList,
  mergeEntries,
  readLocal,
  syncList,
  writeLocal,
} from "@/lib/synced-store";
import type { ScoreBand } from "@/lib/product-score";

export interface ScanRecord {
  at: string; // ISO
  code: string | null;
  name: string | null;
  brand: string | null;
  imageUrl: string | null;
  score: number;
  band: ScoreBand["label"];
  tone: ScoreBand["tone"];
  /** Which scorer graded it. Absent on scans saved before this was recorded. */
  kind?: "food" | "cosmetic";
}

/** What a scan looks like inside the synced store: the record minus the fields
 * the store owns (`at`, `score`). */
type ScanDetail = Omit<ScanRecord, "at" | "score">;

const KEY = "scans";
const MAX = 100;
/** Pre-sync localStorage key, kept so existing members' scans carry over. */
const LEGACY_KEY = "arcane.scan.history";

const toEntry = (r: ScanRecord): SyncedEntry<ScanDetail> => ({
  at: r.at,
  score: r.score,
  detail: {
    code: r.code,
    name: r.name,
    brand: r.brand,
    imageUrl: r.imageUrl,
    band: r.band,
    tone: r.tone,
    ...(r.kind ? { kind: r.kind } : {}),
  },
});

const toRecord = (e: SyncedEntry<ScanDetail>): ScanRecord => ({
  at: e.at,
  score: e.score,
  ...e.detail,
});

function migrateLegacy(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const merged = [...readLocal<ScanDetail>(KEY), ...(parsed as ScanRecord[]).map(toEntry)]
        .filter((e) => e && typeof e.at === "string")
        .sort((a, b) => a.at.localeCompare(b.at))
        .slice(-MAX);
      writeLocal(KEY, merged);
    }
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Malformed legacy blob — not worth breaking the scanner over.
  }
}

/** Instant read of this device's copy, newest last. */
export function loadScans(): ScanRecord[] {
  migrateLegacy();
  return readLocal<ScanDetail>(KEY).map(toRecord);
}

/** Reconcile with the account copy (falls back to local when offline). */
export async function syncScans(): Promise<ScanRecord[]> {
  migrateLegacy();
  if (!getConsent("toolHistory")) return loadScans();
  return (await syncList<ScanDetail>(KEY, MAX)).map(toRecord);
}

export function addScan(record: ScanRecord): ScanRecord[] {
  const persist = getConsent("toolHistory");
  const existing = readLocal<ScanDetail>(KEY);
  // De-dupe repeat scans of the same barcode — keep only the newest.
  const kept = record.code ? existing.filter((e) => e.detail.code !== record.code) : existing;

  // With history off, nothing is written anywhere — the list is just what this
  // session has scanned so far.
  if (!persist) return mergeEntries(kept, [toEntry(record)], MAX).map(toRecord);

  writeLocal(KEY, kept);
  return appendEntry<ScanDetail>(KEY, toEntry(record), MAX).map(toRecord);
}

export async function clearScans(): Promise<void> {
  await clearList(KEY);
}

export interface GradingCounts {
  Excellent: number;
  Good: number;
  Poor: number;
  Bad: number;
}

export function gradingCounts(scans: ScanRecord[]): GradingCounts {
  const counts: GradingCounts = { Excellent: 0, Good: 0, Poor: 0, Bad: 0 };
  // Records come from storage, so a band written by an older version (or
  // hand-edited) can be anything — ignore it rather than produce NaN counts.
  for (const s of scans) {
    if (s.band in counts) counts[s.band] += 1;
  }
  return counts;
}

export interface GroupedScan {
  latest: ScanRecord;
  count: number;
}

/** Collapse repeat scans of the same product (same barcode, or same name and
 * brand for pasted lists) into one row, newest first. */
export function groupScans(scans: ScanRecord[]): GroupedScan[] {
  const groups = new Map<string, GroupedScan>();
  for (const s of scans) {
    const key = s.code ? `code:${s.code}` : `name:${(s.name ?? "").toLowerCase()}|${(s.brand ?? "").toLowerCase()}`;
    const g = groups.get(key);
    if (!g) groups.set(key, { latest: s, count: 1 });
    else {
      g.count += 1;
      if (s.at > g.latest.at) g.latest = s;
    }
  }
  return [...groups.values()].sort((a, b) => b.latest.at.localeCompare(a.latest.at));
}
