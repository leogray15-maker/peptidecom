"use client";

import { useEffect } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

function track(event: string, meta?: Record<string, unknown>) {
  fetch("/api/funnel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, meta }),
  }).catch(() => {});
}

/** Logs an archives_view funnel event when the Archives page mounts. */
export function ArchivesViewTracker() {
  useEffect(() => {
    track("archives_view");
  }, []);
  return null;
}

/** The main Archives call-to-action, instrumented. */
export function ArchivesCta({ url }: { url: string | null }) {
  if (!url) {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-gold-500/40 bg-gold-500/10 px-5 py-3 text-sm font-medium text-gold-200">
        <Sparkles className="h-4 w-4" />
        Doors open soon — members here will be the first invited.
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("archives_cta_click")}
      className="btn inline-flex bg-gold-500 text-black hover:bg-gold-400"
    >
      Step into The Archives <ArrowRight className="h-4 w-4" />
    </a>
  );
}
