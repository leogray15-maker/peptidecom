"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CornerDownLeft, Search } from "lucide-react";
import { ACCOUNT_ITEMS, ADMIN_ITEM, ARCHIVES_ITEM, NAV_GROUPS } from "@/components/app-nav";
import { cn } from "@/lib/utils";

export interface PaletteProtocol {
  slug: string;
  title: string;
  category: string;
}

interface Entry {
  href: string;
  label: string;
  group: string;
  icon: React.ElementType;
}

/**
 * ⌘K / Ctrl+K palette that jumps to any page or protocol. Opened from the
 * topbar search box; closes on Escape, backdrop click or navigation.
 */
export function CommandPalette({
  open,
  onClose,
  protocols,
  isAdmin,
}: {
  open: boolean;
  onClose: () => void;
  protocols: PaletteProtocol[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const entries = useMemo<Entry[]>(() => {
    const pages: Entry[] = NAV_GROUPS.flatMap((g) =>
      g.items.map((i) => ({ href: i.href, label: i.label, group: g.title ?? "Pages", icon: i.icon }))
    );
    const account: Entry[] = [...(isAdmin ? [ADMIN_ITEM] : []), ...ACCOUNT_ITEMS, ARCHIVES_ITEM].map((i) => ({
      href: i.href,
      label: i.label,
      group: "Account",
      icon: i.icon,
    }));
    const protos: Entry[] = protocols.map((p) => ({
      href: `/protocols/${p.slug}`,
      label: p.title,
      group: `Protocols · ${p.category}`,
      icon: BookOpen,
    }));
    return [...pages, ...account, ...protos];
  }, [protocols, isAdmin]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries.filter((e) => !e.group.startsWith("Protocols")).slice(0, 12);
    const words = q.split(/\s+/);
    return entries
      .map((e) => {
        const hay = `${e.label} ${e.group}`.toLowerCase();
        if (!words.every((w) => hay.includes(w))) return null;
        const label = e.label.toLowerCase();
        const rank = label.startsWith(q) ? 0 : label.includes(q) ? 1 : 2;
        return { e, rank };
      })
      .filter((x): x is { e: Entry; rank: number } => x !== null)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 20)
      .map((x) => x.e);
  }, [entries, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setCursor(0), [query]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${cursor}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  function go(entry: Entry | undefined) {
    if (!entry) return;
    onClose();
    router.push(entry.href);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 bg-ink/70" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search tools and protocols"
        className="relative w-full max-w-lg overflow-hidden rounded-card border border-line-strong bg-surface"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Search className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(results.length - 1, c + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(0, c - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                go(results[cursor]);
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder="Search tools, protocols…"
            aria-label="Search tools, protocols"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={results[cursor] ? `palette-${cursor}` : undefined}
            className="h-12 w-full bg-transparent text-[15px] text-fg placeholder:text-fg-muted focus:outline-none focus-visible:outline-none"
          />
          <kbd className="rounded-[5px] border border-line px-1.5 py-0.5 font-mono text-[10.5px] text-fg-muted">
            esc
          </kbd>
        </div>
        <ul id="palette-results" ref={listRef} role="listbox" className="max-h-[50vh] overflow-y-auto p-1.5">
          {results.length === 0 && (
            <li className="px-3 py-8 text-center text-meta text-fg-muted">No matches for “{query}”.</li>
          )}
          {results.map((r, i) => (
            <li key={r.href} role="option" id={`palette-${i}`} aria-selected={i === cursor} data-index={i}>
              <button
                type="button"
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(r)}
                className={cn(
                  "flex min-h-11 w-full items-center gap-3 rounded-[8px] px-3 text-left",
                  i === cursor ? "bg-surface-active" : ""
                )}
              >
                <r.icon className="h-4 w-4 shrink-0 text-accent-strong" strokeWidth={1.75} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm text-fg">{r.label}</span>
                <span className="hidden shrink-0 truncate text-[12px] text-fg-muted sm:block">{r.group}</span>
                {i === cursor && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-fg-muted" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
