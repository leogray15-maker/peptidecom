"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { DisclaimerLine } from "@/components/disclaimer-bar";
import { CommandPalette, type PaletteProtocol } from "@/components/shell/command-palette";
import { Sidebar, type ShellUser } from "@/components/shell/sidebar";
import { Topbar, type TopbarDigest } from "@/components/shell/topbar";
import { TabBar } from "@/components/tab-bar";
import { cn } from "@/lib/utils";

/**
 * Member app frame: 248px sticky sidebar (a slide-over drawer below 1024px),
 * 64px topbar, the page, and the one-line disclaimer at the bottom. Phones
 * and tablets also get a bottom tab bar.
 */
export function AppShell({
  user,
  streak,
  digest,
  protocols,
  children,
}: {
  user: ShellUser;
  streak: number;
  digest: TopbarDigest | null;
  protocols: PaletteProtocol[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    setDrawer(false);
    setPalette(false);
  }, [pathname]);

  // ⌘K / Ctrl+K toggles the palette from anywhere.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock page scroll while the drawer is open; Escape closes it.
  useEffect(() => {
    if (!drawer) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawer(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [drawer]);

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="sticky top-0 hidden h-screen w-sidebar shrink-0 border-r border-line-subtle bg-sidebar lg:block">
        <Sidebar user={user} />
      </aside>

      {/* Drawer (below lg) */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", drawer ? "" : "pointer-events-none")} aria-hidden={!drawer}>
        <div
          onClick={() => setDrawer(false)}
          className={cn(
            "absolute inset-0 bg-ink/70 transition-opacity duration-200 ease-out",
            drawer ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={cn(
            "absolute inset-y-0 left-0 w-[min(288px,86vw)] border-r border-line bg-sidebar transition-transform duration-200 ease-out",
            drawer ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <button
            type="button"
            onClick={() => setDrawer(false)}
            aria-label="Close menu"
            tabIndex={drawer ? 0 : -1}
            className="absolute right-2 top-4 z-10 grid h-11 w-11 place-items-center rounded-control text-fg-secondary hover:bg-surface-active hover:text-fg"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
          {drawer && <Sidebar user={user} onNavigate={() => setDrawer(false)} />}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          streak={streak}
          digest={digest}
          onOpenPalette={() => setPalette(true)}
          onOpenDrawer={() => setDrawer(true)}
        />
        <main id="main" className="w-full min-w-0 flex-1 px-4 pb-8 pt-7 sm:px-6 lg:px-10 lg:pt-9">
          <div className="mx-auto w-full max-w-[1200px]">{children}</div>
        </main>
        <footer className="px-4 pb-24 pt-2 sm:px-6 lg:px-10 lg:pb-6">
          <div className="mx-auto max-w-[1200px] border-t border-line-subtle pt-4">
            <DisclaimerLine />
          </div>
        </footer>
      </div>

      <TabBar onMore={() => setDrawer(true)} />
      <CommandPalette
        open={palette}
        onClose={() => setPalette(false)}
        protocols={protocols}
        isAdmin={user.isAdmin}
      />
    </div>
  );
}
