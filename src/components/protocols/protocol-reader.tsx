"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Markdown, countSteps } from "@/components/markdown";
import { ProgressBar } from "@/components/ui";
import { readProgress, writeProgress } from "@/lib/protocol-progress";
import { cn } from "@/lib/utils";

/**
 * A protocol's body in a readable column: every list item is a checkable
 * step, a thin bar under the topbar shows how far down the page you are, and
 * step progress is saved on this device (it feeds "Continue protocol").
 * Protocols without any list get a single "Mark as read" step.
 */
export function ProtocolReader({ slug, body }: { slug: string; body: string }) {
  const listSteps = countSteps(body);
  const total = Math.max(1, listSteps);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [scroll, setScroll] = useState(0);

  // Load saved steps and record the visit.
  useEffect(() => {
    const saved = readProgress(slug);
    const initial = new Set((saved?.done ?? []).filter((i) => i < total));
    setDone(initial);
    writeProgress(slug, { done: [...initial], total, openedAt: new Date().toISOString() });
  }, [slug, total]);

  useEffect(() => {
    function onScroll() {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setScroll(max > 0 ? Math.min(1, el.scrollTop / max) : 1);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  function toggle(i: number) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      writeProgress(slug, { done: [...next].sort((a, b) => a - b), total, openedAt: new Date().toISOString() });
      return next;
    });
  }

  const finished = done.size >= total;

  return (
    <>
      {/* Reading progress, pinned under the topbar */}
      <div
        className="fixed inset-x-0 top-topbar z-20 h-0.5 lg:left-sidebar"
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(scroll * 100)}
      >
        <div className="h-full bg-accent" style={{ width: `${scroll * 100}%` }} />
      </div>

      <div className="sticky top-[76px] z-10 mb-4 flex items-center gap-3 rounded-control border border-line bg-surface px-4 py-3">
        <span className="shrink-0 text-meta text-fg-muted">
          {listSteps > 0 ? "Steps done" : "Progress"}
        </span>
        <ProgressBar value={done.size} max={total} label="Protocol steps done" className="flex-1" />
        <span className="shrink-0 font-mono text-meta tabular-nums text-fg">
          {done.size}/{total}
        </span>
      </div>

      <article className="card !px-5 !py-6 sm:!px-8 sm:!py-8">
        <Markdown content={body} steps={listSteps > 0 ? { done, onToggle: toggle } : undefined} />
        {listSteps === 0 && (
          <button
            type="button"
            onClick={() => toggle(0)}
            aria-pressed={finished}
            className={cn(
              "mt-6",
              finished ? "btn-secondary" : "btn-primary"
            )}
          >
            <Check className="h-4 w-4" aria-hidden />
            {finished ? "Read" : "Mark as read"}
          </button>
        )}
      </article>
    </>
  );
}
