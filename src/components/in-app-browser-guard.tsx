"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

/** Google's "Use secure browsers" policy blocks OAuth inside embedded
 * webviews (Snapchat, Instagram, Facebook, TikTok…), failing with
 * `403: disallowed_useragent`. We can't fix that server-side — the only
 * good UX is to detect the webview and walk the user out to Safari/Chrome. */

const NAMED_APPS: [RegExp, string][] = [
  [/Snapchat/i, "Snapchat"],
  [/Instagram/i, "Instagram"],
  [/FBAN|FBAV|FB_IAB|FBIOS/i, "Facebook"],
  [/musical_ly|Bytedance|TikTok/i, "TikTok"],
  [/LinkedInApp/i, "LinkedIn"],
  [/Twitter/i, "X (Twitter)"],
  [/ Line\//i, "LINE"],
];

export function detectInAppBrowser(ua: string): string | null {
  for (const [re, name] of NAMED_APPS) if (re.test(ua)) return name;
  // Generic Android WebView marker.
  if (/Android.*; wv\)/i.test(ua)) return "this app";
  // Generic iOS webview: WebKit without the Safari token — but real iOS
  // browsers (Chrome/Firefox/Edge/Opera) have their own tokens instead.
  if (
    /iPhone|iPad|iPod/i.test(ua) &&
    /AppleWebKit/i.test(ua) &&
    !/Safari\//i.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)
  ) {
    return "this app";
  }
  return null;
}

/** Name of the in-app browser we're running inside, or null. Resolves after
 * mount (navigator isn't available during SSR). */
export function useInAppBrowser(): string | null {
  const [app, setApp] = useState<string | null>(null);
  useEffect(() => {
    setApp(detectInAppBrowser(navigator.userAgent));
  }, []);
  return app;
}

/** Shown in place of the Google button inside in-app browsers. */
export function InAppBrowserNotice({ appName }: { appName: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard can be blocked in webviews; the address bar still works.
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-amber-200">
        <ExternalLink className="h-4 w-4 shrink-0" />
        Google sign-in doesn&apos;t work inside {appName}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-amber-200/80">
        Google blocks sign-in inside in-app browsers. Tap the <b>⋯</b> or share menu and choose{" "}
        <b>&ldquo;Open in Browser&rdquo;</b>, or copy the link into Safari or Chrome. Email sign-in
        below still works here.
      </p>
      <button type="button" onClick={copyLink} className="btn-secondary mt-3 w-full !py-2 text-xs">
        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        {copied ? "Link copied — paste it in your browser" : "Copy link for Safari / Chrome"}
      </button>
    </div>
  );
}
