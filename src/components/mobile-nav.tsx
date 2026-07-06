"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, ClipboardList, LayoutDashboard, Map, Menu, X } from "lucide-react";
import { AppNav, ArchivesNavLink, type NavItem } from "@/components/app-nav";
import { Avatar } from "@/components/avatar";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/utils";

// Curated primary destinations for the bottom tab bar (the 5th slot is "Menu").
const PRIMARY: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/tracker", label: "Tracker", icon: ClipboardList },
  { href: "/photos", label: "Photos", icon: Camera },
  { href: "/timeline", label: "Stage", icon: Map },
];

export function MobileNav({
  user,
}: {
  user: { name: string | null; image: string | null; verified: boolean };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-lab-border bg-lab-bg/90 px-4 backdrop-blur lg:hidden">
        <Logo href="/dashboard" />
        <button
          onClick={() => setOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-xl text-slate-300 hover:bg-white/5"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Bottom tab bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-lab-border bg-lab-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-5">
          {PRIMARY.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition",
                  active ? "text-brand-200" : "text-slate-400"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-slate-400"
          >
            <Menu className="h-5 w-5" />
            Menu
          </button>
        </div>
      </div>

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity",
            open ? "opacity-100" : "opacity-0"
          )}
        />
        {/* Panel */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex w-[86%] max-w-xs flex-col border-r border-lab-border bg-lab-card transition-transform duration-200 ease-out",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between border-b border-lab-border p-4">
            <Logo href="/dashboard" />
            <button
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-white/5"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">
            <AppNav onNavigate={() => setOpen(false)} />
          </div>

          <div className="border-t border-lab-border p-4 pt-3">
            <ArchivesNavLink onNavigate={() => setOpen(false)} />
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/5"
            >
              <Avatar name={user.name} image={user.image} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{user.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {user.verified ? "Verified member" : "Member"}
                </p>
              </div>
            </Link>
            <SignOutButton />
          </div>
        </div>
      </div>
    </>
  );
}
