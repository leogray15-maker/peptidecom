"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import type { MilestoneDef } from "@/lib/tsw";

/** Full-screen celebration for a freshly-earned milestone.
 * Order matters: congratulate FIRST, then (softly) open the next-chapter door.
 * The Archives is an invitation, never a wall. */
export function MilestoneCelebration({
  milestones,
  onClose,
}: {
  milestones: MilestoneDef[];
  onClose: () => void;
}) {
  if (milestones.length === 0) return null;
  const primary = milestones[0];

  function ack(extra?: Record<string, unknown>) {
    // Best-effort instrumentation; never block the UI on it.
    for (const m of milestones) {
      fetch("/api/funnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "milestone_celebrated",
          meta: { milestone: m.key, ...extra },
        }),
      }).catch(() => {});
    }
  }

  function close() {
    ack();
    onClose();
  }

  function nextChapter() {
    fetch("/api/funnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "celebration_next_chapter_click",
        meta: { milestone: primary.key },
      }),
    }).catch(() => {});
    ack();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-gold-500/30 bg-lab-card p-8 text-center shadow-2xl shadow-brand-950/50">
        <button
          onClick={close}
          className="absolute right-4 top-4 text-slate-500 hover:text-slate-300"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand-500/30 to-gold-500/30">
          <Sparkles className="h-7 w-7 text-gold-300" />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-white">{primary.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{primary.message}</p>

        {milestones.length > 1 && (
          <p className="mt-3 text-xs text-gold-300">
            +{milestones.length - 1} more milestone{milestones.length > 2 ? "s" : ""} unlocked:{" "}
            {milestones.slice(1).map((m) => m.title).join(" · ")}
          </p>
        )}

        {/* The bridge — after the congratulations, never instead of it */}
        <div className="mt-6 rounded-2xl border border-lab-border bg-lab-bg p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-400/90">
            Your next chapter
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{primary.bridge}</p>
          <Link
            href="/archives"
            onClick={nextChapter}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gold-300 hover:text-gold-200"
          >
            <Sparkles className="h-3.5 w-3.5" /> Peek at The Archives
          </Link>
        </div>

        <button onClick={close} className="btn-primary mt-6 w-full">
          Keep going — back to my recovery
        </button>
      </div>
    </div>
  );
}
