"use client";

// Feature consents.
//
// Everything in the skin tools that could feel sensitive is processed locally —
// photo grading, EASI/POEM scoring and the ingredient scanner all run in the
// browser and nothing is sent to any third-party AI service. These switches let
// the member turn the optional conveniences off.
//
// The choice is stored on the member's profile so it applies on every device
// they sign in on, with a localStorage cache so the switches can be read
// synchronously during render (and still work offline). The account copy is the
// truth; the cache catches up on the next load.

import { CONSENT_DEFAULTS, CONSENT_KEYS, type ConsentKey } from "@/lib/tsw";

export { CONSENT_DEFAULTS, CONSENT_KEYS, type ConsentKey };

const KEY_PREFIX = "arcane.consent.";
const ENDPOINT = "/api/tsw/prefs";

/** Synchronous read of the cached choice. Safe during render. */
export function getConsent(key: ConsentKey): boolean {
  if (typeof window === "undefined") return CONSENT_DEFAULTS[key];
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + key);
    if (raw === null) return CONSENT_DEFAULTS[key];
    return raw === "1";
  } catch {
    return CONSENT_DEFAULTS[key];
  }
}

function cacheConsent(key: ConsentKey, value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY_PREFIX + key, value ? "1" : "0");
  } catch {
    // Storage blocked — the account copy still holds the choice.
  }
}

/** Flip a switch: cached immediately, saved to the profile in the background. */
export function setConsent(key: ConsentKey, value: boolean): void {
  cacheConsent(key, value);
  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ consents: { [key]: value } }),
  }).catch(() => {
    // Offline — the cached choice applies here and syncs on the next change.
  });
}

export function getAllConsents(): Record<ConsentKey, boolean> {
  return {
    photoEstimate: getConsent("photoEstimate"),
    toolHistory: getConsent("toolHistory"),
  };
}

/**
 * Pull the account's switches and adopt them locally. Returns what's now in
 * force. Never throws — offline or signed out just keeps the cached values.
 */
export async function syncConsents(): Promise<Record<ConsentKey, boolean>> {
  try {
    const res = await fetch(ENDPOINT);
    if (!res.ok) return getAllConsents();
    const data = (await res.json()) as {
      consents?: Partial<Record<ConsentKey, boolean>> | null;
    };
    const server = data.consents ?? {};
    for (const key of CONSENT_KEYS) {
      const value = server[key];
      if (typeof value === "boolean") cacheConsent(key, value);
    }
  } catch {
    // Keep the cached values.
  }
  return getAllConsents();
}
