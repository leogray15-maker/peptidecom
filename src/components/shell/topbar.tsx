"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Flame, Menu, Search } from "lucide-react";
import { breadcrumbFor } from "@/components/app-nav";
import { SidebarLogo } from "@/components/shell/sidebar";
import { cn } from "@/lib/utils";

export interface TopbarDigest {
  title: string;
  body: string;
  url: string;
  weekEnding: string;
}

/**
 * 64px topbar: breadcrumb on the left; search (opens the ⌘K palette), streak
 * chip and notifications on the right. On phones the breadcrumb gives way to
 * the logo and a menu button that opens the nav drawer.
 */
export function Topbar({
  streak,
  digest,
  onOpenPalette,
  onOpenDrawer,
}: {
  streak: number;
  digest: TopbarDigest | null;
  onOpenPalette: () => void;
  onOpenDrawer: () => void;
}) {
  const pathname = usePathname();
  const crumb = breadcrumbFor(pathname);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-topbar shrink-0 items-center gap-3 border-b border-line-subtle bg-canvas px-4 sm:px-6 lg:px-10">
      <button
        type="button"
        onClick={onOpenDrawer}
        aria-label="Open menu"
        className="-ml-2 grid h-11 w-11 place-items-center rounded-control text-fg-secondary hover:bg-surface-active hover:text-fg lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>
      <div className="lg:hidden">
        <SidebarLogo />
      </div>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 lg:block">
        <ol className="flex items-center gap-2 text-[13.5px]">
          {crumb.group && (
            <>
              <li className="truncate text-fg-muted">{crumb.group}</li>
              <li aria-hidden>
                <ChevronRight className="h-3.5 w-3.5 text-fg-faint" />
              </li>
            </>
          )}
          {crumb.page && (
            <li className="truncate">
              {crumb.deeper ? (
                <Link href={crumb.page.href} className="text-fg-muted hover:text-fg">
                  {crumb.page.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-medium text-fg">
                  {crumb.page.label}
                </span>
              )}
            </li>
          )}
          {crumb.deeper && (
            <>
              <li aria-hidden>
                <ChevronRight className="h-3.5 w-3.5 text-fg-faint" />
              </li>
              <li aria-current="page" className="truncate font-medium text-fg">
                Detail
              </li>
            </>
          )}
        </ol>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenPalette}
          aria-label="Search tools and protocols"
          aria-keyshortcuts="Meta+K Control+K"
          className="flex h-11 items-center gap-2.5 rounded-control border border-line bg-surface px-3 text-[13.5px] text-fg-muted transition-colors hover:border-line-strong sm:h-10 md:w-64 xl:w-72"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden min-w-0 flex-1 truncate whitespace-nowrap text-left md:block">Search tools, protocols…</span>
          <kbd className="hidden shrink-0 whitespace-nowrap rounded-[5px] border border-line px-1.5 py-0.5 font-mono text-[10.5px] md:block">
            {isMac ? "⌘K" : "Ctrl K"}
          </kbd>
        </button>

        <Link
          href="/tracker"
          className="hidden h-10 items-center gap-2 rounded-control border border-line px-3 text-[13px] font-medium text-fg transition-colors hover:border-line-strong sm:flex"
          aria-label={`${streak}-day logging streak`}
        >
          <Flame className={cn("h-4 w-4", streak > 0 ? "text-score-moderate" : "text-fg-muted")} aria-hidden />
          <span className="tabular-nums">
            {streak > 0 ? `${streak}-day streak` : "Start a streak"}
          </span>
        </Link>

        <Notifications digest={digest} />
      </div>
    </header>
  );
}

const SEEN_KEY = "at:digest-seen";

function Notifications({ digest }: { digest: TopbarDigest | null }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setSeen(localStorage.getItem(SEEN_KEY));
    } catch {
      /* no storage */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = !!digest && seen !== digest.weekEnding;

  function toggle() {
    setOpen((o) => !o);
    if (digest && unread) {
      setSeen(digest.weekEnding);
      try {
        localStorage.setItem(SEEN_KEY, digest.weekEnding);
      } catch {
        /* no storage */
      }
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread ? "Notifications, 1 unread" : "Notifications"}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative grid h-11 w-11 place-items-center rounded-control border border-line text-fg-secondary transition-colors hover:border-line-strong hover:text-fg sm:h-10 sm:w-10"
      >
        <Bell className="h-4 w-4" aria-hidden />
        {unread && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" aria-hidden />}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-card border border-line-strong bg-surface p-4">
          <p className="section-label mb-2">Notifications</p>
          {digest ? (
            <Link href={digest.url} onClick={() => setOpen(false)} className="block rounded-control p-2 -m-2 hover:bg-surface-active">
              <p className="text-sm font-semibold text-fg">{digest.title}</p>
              <p className="mt-1 text-meta text-fg-secondary">{digest.body}</p>
              <p className="mt-1.5 font-mono text-[11px] text-fg-muted">Week ending {digest.weekEnding}</p>
            </Link>
          ) : (
            <p className="text-meta text-fg-muted">
              You&apos;re all caught up. Your weekly digest shows up here once you&apos;ve logged a few days.
            </p>
          )}
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="mt-3 inline-block text-[13px] font-medium text-accent-strong hover:underline"
          >
            Notification settings
          </Link>
        </div>
      )}
    </div>
  );
}
