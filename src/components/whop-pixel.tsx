"use client";

// The inline pixel in <head> fires one "page" event when the document loads.
// This app is a client-routed Next.js app, so most page views after that are
// SPA navigations that never reload the document — without this, Whop would
// only ever see the first page of a visit. Reports the rest.

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    whop?: { track: (event: string, meta?: Record<string, unknown>) => void };
  }
}

export function WhopPageViews() {
  const pathname = usePathname();
  // The head snippet already tracked the page we mounted on.
  const tracked = useRef(pathname);

  useEffect(() => {
    if (tracked.current === pathname) return;
    tracked.current = pathname;
    // The pixel queues events until t.whop.tw/s.js loads, so this is safe to
    // call early; the optional chain covers the script being blocked outright.
    window.whop?.track("page");
  }, [pathname]);

  return null;
}
