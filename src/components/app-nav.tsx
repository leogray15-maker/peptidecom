"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calculator,
  LineChart,
  MessageSquare,
  MessagesSquare,
  Store,
  FlaskConical,
  PackageCheck,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/community", label: "Community", icon: MessageSquare },
  { href: "/chat", label: "Live chat", icon: MessagesSquare },
  { href: "/calculator", label: "Calculator", icon: Calculator },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/vendors", label: "Vendors", icon: Store },
  { href: "/lab-tests", label: "Lab tests", icon: FlaskConical },
  { href: "/group-buys", label: "Group buys", icon: PackageCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppNav({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const pathname = usePathname();
  const horizontal = orientation === "horizontal";
  return (
    <nav
      className={cn(
        horizontal ? "flex gap-1 overflow-x-auto" : "space-y-1"
      )}
    >
      {nav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl text-sm font-medium transition",
              horizontal
                ? "shrink-0 flex-col gap-1 px-3 py-1.5 text-[11px]"
                : "px-3 py-2.5",
              active
                ? "bg-brand-500/15 text-brand-200"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
            )}
          >
            <item.icon className={cn(horizontal ? "h-5 w-5" : "h-4.5 w-4.5")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
