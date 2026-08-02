"use client";

// Thin client-side event tracker. Rides the existing funnel pipeline
// (POST /api/funnel → Firestore `funnelEvents`) rather than adding a second
// analytics system — same auth, same storage, same "instrumentation must never
// break the product" guarantee (failures are swallowed).
//
// Event names are validated server-side against FUNNEL_EVENTS in lib/tsw.ts,
// so adding a new one means adding it there too.

import type { FunnelEvent } from "@/lib/tsw";

export function trackEvent(event: FunnelEvent, meta?: Record<string, unknown>): void {
  void fetch("/api/funnel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, meta }),
  }).catch(() => {});
}
