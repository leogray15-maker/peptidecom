"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, SearchX } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui";
import { type ProtocolProgress, readAllProgress } from "@/lib/protocol-progress";
import { cn } from "@/lib/utils";

export interface ProtocolCard {
  slug: string;
  title: string;
  category: string;
  summary: string;
}

/** The Protocols page body: header with search, the intro, sticky section
 * tabs and the card grid. */
export function ProtocolsBrowser({
  protocols,
  categories,
  intro,
}: {
  protocols: ProtocolCard[];
  categories: string[];
  intro: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<string>("all");
  const [progress, setProgress] = useState<Record<string, ProtocolProgress>>({});

  useEffect(() => setProgress(readAllProgress()), []);

  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      protocols.filter(
        (p) => !q || `${p.title} ${p.summary} ${p.category}`.toLowerCase().includes(q)
      ),
    [protocols, q]
  );
  const shown = tab === "all" ? matches : matches.filter((p) => p.category === tab);
  const countFor = (c: string) => matches.filter((p) => p.category === c).length;

  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="Protocols"
        subtitle="The healing library: step-by-step protocols, curated by the lab."
        actions={
          <div role="search" className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" aria-hidden />
            <label htmlFor="protocol-search" className="sr-only">
              Search protocols
            </label>
            <input
              id="protocol-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search protocols"
              className="input pl-9"
            />
          </div>
        }
      />
      {intro}

      {/* Section tabs, sticky under the topbar */}
      <div className="sticky top-topbar z-10 -mx-4 mb-5 border-b border-line-subtle bg-canvas px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div role="tablist" aria-label="Protocol sections" className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {[{ id: "all", label: "All", count: matches.length }, ...categories.map((c) => ({ id: c, label: c, count: countFor(c) }))].map(
            (t) => {
              const on = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "-mb-px flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-[13.5px] transition-colors",
                    on
                      ? "border-accent font-medium text-fg-active"
                      : "border-transparent text-fg-muted hover:text-fg"
                  )}
                >
                  {t.label}
                  <span className="font-mono text-[11.5px] tabular-nums text-fg-muted">({t.count})</span>
                </button>
              );
            }
          )}
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No protocols match"
          body={q ? `Nothing for “${query}” in this section.` : "This section is empty."}
          action={
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setQuery("");
                setTab("all");
              }}
            >
              Show all protocols
            </button>
          }
        />
      ) : (
        <div role="tabpanel" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => {
            const pr = progress[p.slug];
            return (
              <Link
                key={p.slug}
                href={`/protocols/${p.slug}`}
                className="card group flex flex-col transition-colors hover:border-line-strong hover:bg-surface-active/50"
              >
                <p className="section-label">{p.category}</p>
                <h2 className="card-title mt-2">{p.title}</h2>
                <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-fg-secondary">{p.summary}</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <span className="inline-flex items-center gap-1 text-[13.5px] font-medium text-accent-strong">
                    Read protocol
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
                  </span>
                  {pr && pr.total > 0 && pr.done.length > 0 && (
                    <span className="font-mono text-[11.5px] tabular-nums text-fg-muted">
                      {pr.done.length}/{pr.total} done
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
