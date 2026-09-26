"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronsUpDown, LogOut } from "lucide-react";
import {
  ACCOUNT_ITEMS,
  ADMIN_ITEM,
  ARCHIVES_ITEM,
  NAV_GROUPS,
  type NavItem,
  isActivePath,
  trackArchivesClick,
} from "@/components/app-nav";
import { ArcaneMark } from "@/components/arcane-mark";
import { Avatar } from "@/components/avatar";
import { endSession } from "@/lib/session-client";
import { cn } from "@/lib/utils";

export interface ShellUser {
  name: string | null;
  image: string | null;
  verified: boolean;
  isAdmin: boolean;
}

const COLLAPSE_KEY = "at:nav-collapsed";

function readCollapsed(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(COLLAPSE_KEY) ?? "{}") ?? {};
  } catch {
    return {};
  }
}

export function SidebarLogo({ onNavigate }: { onNavigate?: () => void }) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Arcane Track";
  return (
    <Link
      href="/dashboard"
      onClick={onNavigate}
      className="flex min-h-10 items-center gap-2.5 rounded-nav px-1"
    >
      <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[8px] bg-primary">
        <ArcaneMark className="h-[19px] w-[19px] text-white" />
      </span>
      <span className="text-[15px] font-semibold tracking-[-0.01em] text-fg">{appName}</span>
    </Link>
  );
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 items-center gap-2.5 rounded-nav px-2.5 text-[13.5px] transition-colors duration-150 ease-out lg:h-8",
        active
          ? "bg-surface-active font-medium text-fg-active"
          : "text-fg-secondary hover:bg-surface-active/60 hover:text-fg"
      )}
    >
      <Icon
        className={cn("h-[17px] w-[17px] shrink-0", active ? "text-accent-strong" : "text-fg-muted")}
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

/**
 * The member sidebar: logo, collapsible nav groups (state remembered per
 * browser), The Archives, and the user row with its account menu. Used as the
 * sticky desktop rail and inside the mobile drawer.
 */
export function Sidebar({ user, onNavigate }: { user: ShellUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCollapsed(readCollapsed());
  }, []);

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable: state just won't persist */
      }
      return next;
    });
  }

  const archivesActive = isActivePath(pathname, ARCHIVES_ITEM.href);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-4 pb-3 pt-5">
        <SidebarLogo onNavigate={onNavigate} />
      </div>

      <nav aria-label="Main" className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]">
        {NAV_GROUPS.map((group) => {
          // A group holding the current page never hides it.
          const holdsActive = group.items.some((i) => isActivePath(pathname, i.href));
          const isCollapsed = !!group.title && !!collapsed[group.id] && !holdsActive;
          const listId = `nav-${group.id}`;
          return (
            <div key={group.id} className={group.title ? "mt-4" : undefined}>
              {group.title && (
                <button
                  type="button"
                  onClick={() => toggle(group.id)}
                  aria-expanded={!isCollapsed}
                  aria-controls={listId}
                  className="group flex h-9 w-full items-center justify-between rounded-nav px-2.5 text-label font-medium uppercase text-fg-muted transition-colors hover:text-fg-secondary lg:h-7"
                >
                  {group.title}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 opacity-0 transition-transform duration-150 ease-out group-hover:opacity-100 group-focus-visible:opacity-100",
                      isCollapsed && "-rotate-90 opacity-100"
                    )}
                    aria-hidden
                  />
                </button>
              )}
              <div id={listId} hidden={isCollapsed} className="space-y-px">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={isActivePath(pathname, item.href)}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-line-subtle px-3 pb-3 pt-3">
        <Link
          href={ARCHIVES_ITEM.href}
          onClick={() => {
            trackArchivesClick();
            onNavigate?.();
          }}
          aria-current={archivesActive ? "page" : undefined}
          className={cn(
            "flex h-11 items-center justify-between gap-2 rounded-nav px-2.5 text-[13.5px] text-gold transition-colors lg:h-9",
            archivesActive ? "bg-surface-active" : "hover:bg-surface-active/60"
          )}
        >
          <span className="flex items-center gap-2.5">
            <ARCHIVES_ITEM.icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.75} aria-hidden />
            The Archives
          </span>
          <span className="rounded-full border border-gold-line px-2 py-px font-mono text-[10px] font-medium tracking-[0.08em]">
            SOON
          </span>
        </Link>
        <UserMenu user={user} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function UserMenu({ user, onNavigate }: { user: ShellUser; onNavigate?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  async function signOut() {
    await endSession();
    router.push("/");
    router.refresh();
  }

  const items = [...(user.isAdmin ? [ADMIN_ITEM] : []), ...ACCOUNT_ITEMS];
  const itemCls =
    "flex min-h-10 w-full items-center gap-2.5 rounded-[7px] px-2.5 text-left text-[13.5px] text-fg-secondary transition-colors hover:bg-surface-active hover:text-fg";

  return (
    <div ref={ref} className="relative mt-1">
      {open && (
        <div
          id="user-menu"
          className="absolute inset-x-0 bottom-full mb-1.5 rounded-control border border-line-strong bg-surface p-1"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className={itemCls}
            >
              <item.icon className="h-4 w-4 shrink-0 text-fg-muted" strokeWidth={1.75} aria-hidden />
              {item.label}
            </Link>
          ))}
          <div className="my-1 border-t border-line-subtle" />
          <button type="button" onClick={signOut} className={itemCls}>
            <LogOut className="h-4 w-4 shrink-0 text-fg-muted" strokeWidth={1.75} aria-hidden />
            Sign out
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="user-menu"
        aria-haspopup="true"
        className="flex min-h-12 w-full items-center gap-2.5 rounded-nav px-2 py-1.5 text-left transition-colors hover:bg-surface-active/60"
      >
        <Avatar name={user.name} image={user.image} className="h-8 w-8" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-medium text-fg">{user.name}</span>
          <span className="block truncate text-[12px] text-fg-muted">
            {user.verified ? "Verified member" : "Member"}
          </span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
      </button>
    </div>
  );
}
