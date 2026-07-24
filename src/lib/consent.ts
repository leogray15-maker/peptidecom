"use client";

// On-device feature consents.
//
// Everything in the Arcane skin tools that could feel sensitive is processed
// locally — photo grading, EASI/POEM history and the ingredient scanner all run
// in the browser and nothing is sent to any third-party AI service. These
// switches let the member turn the optional on-device conveniences off anyway,
// and they're stored in localStorage so the choice sticks on this device.

export type ConsentKey = "photoEstimate" | "toolHistory";

const KEY_PREFIX = "arcane.consent.";

/** Defaults: on-device conveniences are enabled unless the member opts out. */
const DEFAULTS: Record<ConsentKey, boolean> = {
  photoEstimate: true,
  toolHistory: true,
};

export function getConsent(key: ConsentKey): boolean {
  if (typeof window === "undefined") return DEFAULTS[key];
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + key);
    if (raw === null) return DEFAULTS[key];
    return raw === "1";
  } catch {
    return DEFAULTS[key];
  }
}

export function setConsent(key: ConsentKey, value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY_PREFIX + key, value ? "1" : "0");
  } catch {
    // ignore storage failures — the feature still works with defaults
  }
}
