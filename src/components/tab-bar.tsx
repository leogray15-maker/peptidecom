"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloudSun, Compass, Hand, LayoutGrid, Scan } from "lucide-react";
import { cn } from "@/lib/utils";

/** The five things a member does most, one thumb-reach away. Everything else
 * lives in the drawer (phones) or the sidebar (desktop). */
export const TABS = [
  { href: "/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/itch", label: "Itch", icon: Hand },
  { href: "/forecast", label: "Forecast", icon: CloudSun },
  { href: "/scan", label: "Scan", icon: Scan },
  { href: "/coach", label: "Coach", icon: Compass },
] as const;

/**
 * Floating bottom tab bar for phones. Sits above the home-indicator area on
 * iOS (env(safe-area-inset-bottom) via the pb utility on the wrapper) and is
 * replaced by the sidebar from `lg` up.
 */
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div className="flex w-full max-w-md items-center justify-between gap-0.5 rounded-full border border-lab-border bg-lab-card/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-full px-1 py-2 text-[11px] font-medium transition",
                active
                  ? "bg-brand-500/20 text-brand-200"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <tab.icon className={cn("h-5 w-5 shrink-0", active && "text-brand-300")} />
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
