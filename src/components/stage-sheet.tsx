"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Map, X } from "lucide-react";
import type { TswStage } from "@/lib/tsw";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * Tappable "current stage" label that opens the full stage taxonomy.
 *
 * The taxonomy itself is config, not copy baked into this component — it comes
 * from `CONDITIONS[].stages` (lib/conditions.ts), so a new condition gets a
 * correct sheet for free.
 *
 * NOTE: stages here are member-marked on /timeline, not derived by the app.
 * `movesOnWhen` therefore describes what members typically notice at the
 * boundary; it is not a rule the system evaluates.
 */
export function StageSheet({
  stages,
  currentStageId,
  currentStageName,
}: {
  stages: TswStage[];
  currentStageId: string | null;
  currentStageName: string;
}) {
  const [open, setOpen] = useState(false);

  // Lock the page behind the sheet, close on Escape, and let the phone's back
  // gesture close it rather than leave the dashboard (same pattern as the
  // photo compare overlay).
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    window.history.pushState({ stageSheet: true }, "");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPop = () => setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    if (window.history.state?.stageSheet) window.history.back();
    else setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          trackEvent("stage_sheet_open", { stage: currentStageId });
        }}
        className="mt-1 flex items-start gap-1 text-left text-base font-bold leading-snug text-white transition hover:text-brand-200 sm:text-xl"
        title="See every stage and what marks the move between them"
      >
        {currentStageName}
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm"
          onClick={close}
        >
          <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
            <div
              className="w-full max-w-2xl rounded-t-3xl border border-lab-border bg-lab-card p-6 shadow-2xl sm:rounded-3xl sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Map className="h-5 w-5 text-brand-300" />
                  <h2 className="text-lg font-semibold text-white">The stages</h2>
                </div>
                <button
                  onClick={close}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                A rough map, not a schedule. You mark where you are yourself — nothing here
                moves you between stages automatically, and skipping about is normal.
              </p>

              <ol className="mt-5 space-y-4">
                {stages.map((s, i) => {
                  const current = s.id === currentStageId;
                  return (
                    <li
                      key={s.id}
                      className={cn(
                        "rounded-2xl border p-4",
                        current
                          ? "border-brand-500/50 bg-brand-950/30"
                          : "border-lab-border bg-lab-bg/40"
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500/15 text-[11px] font-bold text-brand-200">
                          {i + 1}
                        </span>
                        <p className="font-semibold text-white">{s.name}</p>
                        {current && (
                          <span className="badge border border-brand-500/40 bg-brand-500/15 text-brand-200">
                            You&apos;re here
                          </span>
                        )}
                        <span className="text-xs text-slate-500">{s.timeframe}</span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-300">{s.summary}</p>
                      <ul className="mt-2 space-y-1">
                        {s.experiences.map((e) => (
                          <li key={e} className="flex gap-2 text-xs text-slate-400">
                            <span
                              aria-hidden
                              className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-600"
                            />
                            {e}
                          </li>
                        ))}
                      </ul>
                      {s.movesOnWhen && (
                        <p className="mt-3 border-t border-lab-border pt-2 text-xs leading-relaxed text-slate-500">
                          <span className="font-semibold text-slate-400">
                            People usually move on when:{" "}
                          </span>
                          {s.movesOnWhen}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>

              <Link href="/timeline" onClick={close} className="btn-secondary mt-5">
                Change where I am
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
