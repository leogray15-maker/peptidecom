"use client";

// On-device history of scanned products, for the "History" list and the
// grading Overview. Stored in localStorage only — nothing is uploaded. Honours
// the same "save tool history" consent as the EASI/POEM tools.

import { getConsent } from "@/lib/consent";
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
}

const KEY = "arcane.scan.history";
const MAX = 100;

export function loadScans(): ScanRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ScanRecord[]) : [];
  } catch {
    return [];
  }
}

export function addScan(record: ScanRecord): ScanRecord[] {
  const existing = loadScans();
  // De-dupe consecutive scans of the same barcode.
  const deduped = record.code
    ? existing.filter((r) => r.code !== record.code)
    : existing;
  const next = [...deduped, record].slice(-MAX);
  if (getConsent("toolHistory")) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // storage blocked — history just won't persist
    }
  }
  return next;
}

export function clearScans(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // no-op
  }
}

export interface GradingCounts {
  Excellent: number;
  Good: number;
  Poor: number;
  Bad: number;
}

export function gradingCounts(scans: ScanRecord[]): GradingCounts {
  const counts: GradingCounts = { Excellent: 0, Good: 0, Poor: 0, Bad: 0 };
  for (const s of scans) counts[s.band] += 1;
  return counts;
}
