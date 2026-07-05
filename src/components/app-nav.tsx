"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  Camera,
  ClipboardList,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  ListChecks,
  Map,
  MessageSquare,
  MessagesSquare,
  Settings,
  Sparkles,
  Syringe,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  gold?: boolean;
}

const sections: { title: string | null; items: NavItem[] }[] = [
  {
    title: null,
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Recovery",
    items: [
      { href: "/tracker", label: "Daily tracker", icon: ClipboardList },
      { href: "/photos", label: "Photo timeline", icon: Camera },
      { href: "/timeline", label: "Where am I?", icon: Map },
      { href: "/insights", label: "Insights", icon: TrendingUp },
      { href: "/triggers", label: "Triggers", icon: ListChecks },
      { href: "/doctor", label: "Doctor prep", icon: HeartHandshake },
      { href: "/support", label: "Flare-day support", icon: LifeBuoy },
    ],
  },
  {
    title: "Community",
    items: [
      { href: "/community", label: "Community", icon: MessageSquare },
      { href: "/chat", label: "Live chat", icon: MessagesSquare },
      { href: "/won", label: "Won — stories", icon: Trophy },
      { href: "/protocols", label: "Protocols", icon: GraduationCap },
    ],
  },
  {
    title: "The Lab",
    items: [
      { href: "/peptides", label: "Peptide tracker", icon: Syringe },
      { href: "/calculator", label: "Calculator", icon: Calculator },
      { href: "/progress", label: "Progress", icon: LineChart },
    ],
  },
  {
    title: null,
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

// Ambient, low-key "next chapter" door. Pinned outside the scrolling nav in the
// sidebar footer so it's persistently visible — familiar, never pushy.
const archivesItem: NavItem = { href: "/archives", label: "The Archives", icon: Sparkles, gold: true };

function trackArchivesClick() {
  fetch("/api/funnel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "archives_nav_click" }),
  }).catch(() => {});
}

export function AppNav({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const pathname = usePathname();
  const horizontal = orientation === "horizontal";

  const renderItem = (item: NavItem) => {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={item.href === "/archives" ? trackArchivesClick : undefined}
        className={cn(
          "flex items-center gap-3 rounded-xl text-sm font-medium transition",
          horizontal ? "shrink-0 flex-col gap-1 px-3 py-1.5 text-[11px]" : "px-3 py-2",
          active
            ? item.gold
              ? "bg-gold-500/15 text-gold-200"
              : "bg-brand-500/15 text-brand-200"
            : item.gold
              ? "text-gold-400/80 hover:bg-gold-500/10 hover:text-gold-200"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
        )}
      >
        <item.icon className={cn(horizontal ? "h-5 w-5" : "h-4.5 w-4.5")} />
        {item.label}
      </Link>
    );
  };

  if (horizontal) {
    return (
      <nav className="flex gap-1 overflow-x-auto">
        {[...sections.flatMap((s) => s.items), archivesItem].map(renderItem)}
      </nav>
    );
  }

  return (
    <nav className="space-y-4">
      {sections.map((section, i) => (
        <div key={section.title ?? i}>
          {section.title && (
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              {section.title}
            </p>
          )}
          <div className="space-y-0.5">{section.items.map(renderItem)}</div>
        </div>
      ))}
    </nav>
  );
}

/** Persistent "next chapter" link for the sidebar footer. */
export function ArchivesNavLink() {
  const pathname = usePathname();
  const active = pathname === "/archives" || pathname.startsWith("/archives/");
  return (
    <Link
      href="/archives"
      onClick={trackArchivesClick}
      className={cn(
        "mb-2 flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-gold-500/15 text-gold-200"
          : "text-gold-400/80 hover:bg-gold-500/10 hover:text-gold-200"
      )}
    >
      <span className="flex items-center gap-3 whitespace-nowrap">
        <Sparkles className="h-4.5 w-4.5 shrink-0" />
        The Archives
      </span>
      <span className="shrink-0 whitespace-nowrap rounded-full border border-gold-500/30 px-2 py-0.5 text-[9px] uppercase tracking-wider text-gold-500/80">
        Next
      </span>
    </Link>
  );
}
