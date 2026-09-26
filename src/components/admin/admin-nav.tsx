"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, CheckSquare, Gauge, History, Images, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Overview", icon: Gauge, exact: true },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/proof", label: "Proof wall", icon: Images },
  { href: "/admin/stories", label: "Stories", icon: Trophy },
  { href: "/admin/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/admin/activity", label: "Activity", icon: History },
];

function itemClass(active: boolean) {
  return cn(
    "flex h-8 items-center gap-2.5 rounded-nav px-2.5 text-[13.5px] transition-colors",
    active ? "bg-surface-active font-medium text-fg-active" : "text-fg-secondary hover:bg-surface-active/60 hover:text-fg"
  );
}

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="space-y-px">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link key={item.href} href={item.href} className={itemClass(active)}>
            <item.icon
              className={cn("h-[17px] w-[17px] shrink-0", active ? "text-accent-strong" : "text-fg-muted")}
              strokeWidth={1.75}
              aria-hidden
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Compact horizontal tabs for phones (the sidebar is desktop-only). */
export function AdminMobileNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin] lg:hidden">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
              active ? "border-primary bg-chip text-fg-active" : "border-line text-fg-secondary hover:text-fg"
            )}
          >
            <item.icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BackToAppLink() {
  return (
    <Link
      href="/dashboard"
      className="flex h-9 items-center gap-2.5 rounded-nav px-2.5 text-[13.5px] text-fg-secondary transition-colors hover:bg-surface-active/60 hover:text-fg"
    >
      <ArrowLeft className="h-[17px] w-[17px] shrink-0" strokeWidth={1.75} aria-hidden />
      Back to app
    </Link>
  );
}
