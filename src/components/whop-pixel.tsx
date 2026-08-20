"use client";

// Client-side half of the Whop pixel. The inline snippet in <head> (see
// lib/whop-pixel.ts) defines window.whop and fires one "page" event when the
// document loads; everything here reports what happens after that.

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { type WhopEventName } from "@/lib/whop-pixel";

declare global {
  interface Window {
    whop?: {
      track: (event: WhopEventName, meta?: Record<string, unknown>) => void;
    };
  }
}

/**
 * Report an event to Whop. Safe to call anywhere on the client: the pixel
 * queues events until t.whop.tw/s.js loads, and the optional chain covers the
 * script being blocked outright. Instrumentation must never break the product,
 * so this swallows everything.
 */
export function whopTrack(event: WhopEventName, meta?: Record<string, unknown>): void {
  try {
    // Called with one argument when there's no metadata: the pixel queues the
    // raw argument list, and a trailing `undefined` rides along into the event.
    if (meta) window.whop?.track(event, meta);
    else window.whop?.track(event);
  } catch {
    // ignore
  }
}

/**
 * Fires one Whop event when it mounts. Lets a server component report an event
 * for a page view — `<WhopEvent event="view_content" />` — without turning the
 * page itself into a client component.
 */
export function WhopEvent({
  event,
  meta,
}: {
  event: WhopEventName;
  meta?: Record<string, unknown>;
}) {
  // Guarded because React StrictMode runs effects twice in development, and a
  // double-counted conversion is worse than a missing one.
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    whopTrack(event, meta);
    // Deliberately mount-only: this reports "the page was viewed", not "the
    // props changed". Route changes remount it, which is exactly right.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

/**
 * The head snippet only fires "page" on document load. This app is client
 * routed, so most page views after the first are soft navigations that never
 * reload the document — without this, Whop would see one page per visit rather
 * than one per page. Reports the rest.
 */
export function WhopPageViews() {
  const pathname = usePathname();
  // The head snippet already tracked the page we mounted on.
  const tracked = useRef(pathname);

  useEffect(() => {
    if (tracked.current === pathname) return;
    tracked.current = pathname;
    whopTrack("page");
  }, [pathname]);

  return null;
}
