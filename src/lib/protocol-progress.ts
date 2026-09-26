// Reading progress for the Protocols library, kept on this device only
// (localStorage). Nothing here touches the server or the database.

const KEY = "at:protocol-progress";

export interface ProtocolProgress {
  /** Indexes of the steps the member has ticked off. */
  done: number[];
  /** Total steps in the protocol when last opened. */
  total: number;
  /** ISO timestamp of the last visit — "Continue protocol" picks the latest. */
  openedAt: string;
}

export function readAllProgress(): Record<string, ProtocolProgress> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

export function readProgress(slug: string): ProtocolProgress | null {
  return readAllProgress()[slug] ?? null;
}

export function writeProgress(slug: string, progress: ProtocolProgress) {
  try {
    const all = readAllProgress();
    all[slug] = progress;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable: progress just won't persist */
  }
}

/** The most recently opened protocol that isn't finished yet. */
export function latestInProgress(): { slug: string; progress: ProtocolProgress } | null {
  const entries = Object.entries(readAllProgress())
    .filter(([, p]) => p.total === 0 || p.done.length < p.total)
    .sort((a, b) => b[1].openedAt.localeCompare(a[1].openedAt));
  return entries[0] ? { slug: entries[0][0], progress: entries[0][1] } : null;
}
