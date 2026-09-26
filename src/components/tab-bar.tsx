"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LayoutDashboard, Menu, MessageSquare, ScanLine } from "lucide-react";
import { isActivePath } from "@/components/app-nav";
import { cn } from "@/lib/utils";

export const TABS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tracker", label: "Tracker", icon: ClipboardList },
  { href: "/scan", label: "Scanner", icon: ScanLine },
  { href: "/community", label: "Community", icon: MessageSquare },
] as const;

/** Bottom tab bar for phones and tablets (<1024px). "More" opens the drawer. */
export function TabBar({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();
  const item =
    "flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] transition-colors";

  return (
    <nav
      aria-label="Quick links"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-sidebar pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch px-2">
        {TABS.map((tab) => {
          const active = isActivePath(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(item, active ? "font-medium text-fg-active" : "text-fg-muted hover:text-fg")}
            >
              <tab.icon
                className={cn("h-5 w-5", active ? "text-accent-strong" : "")}
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
        <button type="button" onClick={onMore} className={cn(item, "text-fg-muted hover:text-fg")}>
          <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          More
        </button>
      </div>
    </nav>
  );
}
