"use client";

import { useEffect, useRef, useState } from "react";

// Cloudflare Turnstile widget.
//
// Renders nothing at all when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset, so
// local dev and every deploy before the keys exist behave exactly as before —
// matching the server's fail-open behaviour in lib/turnstile.ts.
//
// The script is loaded on demand rather than in the root layout: only two
// screens need it, and a health app shouldn't ship a third-party script to
// every page that doesn't.

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      remove: (id: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    if (window.turnstile) return resolve();
    const el = document.createElement("script");
    el.src = SCRIPT_SRC;
    el.async = true;
    el.defer = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("Turnstile failed to load"));
    document.head.appendChild(el);
  });
  return scriptPromise;
}

/**
 * Invisible-until-needed bot check. Calls `onToken` with a token to submit
 * alongside the form, or with null when the token expires and must be re-earned.
 */
export function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    let widgetId: string | null = null;
    const el = ref.current;

    loadScript()
      .then(() => {
        if (!window.turnstile) return;
        widgetId = window.turnstile.render(el, {
          sitekey: siteKey,
          theme: "dark",
          callback: (token) => onToken(token),
          "expired-callback": () => onToken(null),
          "error-callback": () => setFailed(true),
        });
      })
      .catch(() => setFailed(true));

    return () => {
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) return null;

  return (
    <div>
      <div ref={ref} />
      {failed && (
        <p className="mt-1 text-xs text-slate-500">
          The human check couldn&apos;t load. If this keeps happening, try a different network.
        </p>
      )}
    </div>
  );
}
