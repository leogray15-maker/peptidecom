"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ButtonLink, EmptyState, ProgressBar } from "@/components/ui";
import { latestInProgress, type ProtocolProgress } from "@/lib/protocol-progress";

/** "Continue protocol" — the last protocol opened on this device and how far
 * through its steps the member is. Reads local progress only. */
export function ContinueProtocol({ titles }: { titles: Record<string, { title: string; category: string }> }) {
  const [state, setState] = useState<{ slug: string; progress: ProtocolProgress } | null | undefined>(undefined);

  useEffect(() => {
    const latest = latestInProgress();
    setState(latest && titles[latest.slug] ? latest : null);
  }, [titles]);

  return (
    <section className="card flex flex-col" aria-labelledby="protocol-title">
      <h2 id="protocol-title" className="card-title mb-4">
        Continue protocol
      </h2>
      {state === undefined ? (
        <div className="h-24 animate-pulse rounded-control bg-surface-active" aria-hidden />
      ) : state === null ? (
        <EmptyState
          icon={BookOpen}
          title="No protocol in progress"
          body="Open a protocol and tick off its steps as you go."
          action={<ButtonLink href="/protocols" size="sm" variant="secondary">Browse protocols</ButtonLink>}
          className="flex-1 py-6"
        />
      ) : (
        <div className="flex flex-1 flex-col">
          <p className="section-label">{titles[state.slug].category}</p>
          <p className="mt-1 text-[15px] font-semibold text-fg">{titles[state.slug].title}</p>
          <div className="mt-auto pt-5">
            <div className="mb-2 flex justify-between text-meta">
              <span className="text-fg-muted">Steps done</span>
              <span className="font-mono tabular-nums text-fg">
                {state.progress.done.length}/{state.progress.total}
              </span>
            </div>
            <ProgressBar
              value={state.progress.done.length}
              max={Math.max(1, state.progress.total)}
              label="Protocol progress"
            />
            <Link
              href={`/protocols/${state.slug}`}
              className="mt-4 inline-block text-[13.5px] font-medium text-accent-strong hover:underline"
            >
              Continue reading →
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
