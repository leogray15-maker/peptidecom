"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, CheckSquare, Gauge, History, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Overview", icon: Gauge, exact: true },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/admin/activity", label: "Activity", icon: History },
];

function itemClass(active: boolean) {
  return cn(
    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
    active ? "bg-brand-500/15 text-brand-200" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
  );
}

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link key={item.href} href={item.href} className={itemClass(active)}>
            <item.icon className="h-4.5 w-4.5 shrink-0" />
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
    <nav className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:thin] lg:hidden">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
              active ? "bg-brand-500/15 text-brand-200" : "text-slate-400 hover:bg-white/5"
            )}
          >
            <item.icon className="h-4 w-4" />
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
      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-slate-100"
    >
      <ArrowLeft className="h-4.5 w-4.5 shrink-0" />
      Back to app
    </Link>
  );
}
