import {
  BookOpen,
  Calculator,
  Camera,
  ClipboardCheck,
  ClipboardList,
  CloudSun,
  Compass,
  Hand,
  LayoutDashboard,
  Library,
  LifeBuoy,
  ListChecks,
  Map,
  MessageSquare,
  MessagesSquare,
  NotebookPen,
  Ruler,
  ScanEye,
  ScanLine,
  Settings,
  ShieldCheck,
  Sparkles,
  Syringe,
  TrendingUp,
  Trophy,
  UtensilsCrossed,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

export interface NavGroup {
  id: string;
  title: string | null;
  items: NavItem[];
}

/** The member app's navigation, in sidebar order. Groups with a title can be
 * collapsed; the untitled first group is always open. */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "main",
    title: null,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/coach", label: "Coach", icon: Compass },
    ],
  },
  {
    id: "every-day",
    title: "Every day",
    items: [
      { href: "/itch", label: "Itch check-in", icon: Hand },
      { href: "/tracker", label: "Daily tracker", icon: ClipboardList },
      { href: "/forecast", label: "Flare forecast", icon: CloudSun },
      { href: "/photos", label: "Photo timeline", icon: Camera },
      { href: "/timeline", label: "Where am I?", icon: Map },
      { href: "/insights", label: "Insights", icon: TrendingUp },
      { href: "/triggers", label: "Triggers", icon: ListChecks },
      { href: "/support", label: "Flare-day support", icon: LifeBuoy },
    ],
  },
  {
    id: "skin-tools",
    title: "Skin tools",
    items: [
      { href: "/grade", label: "AI flare grading", icon: ScanEye },
      { href: "/easi", label: "EASI calculator", icon: Ruler },
      { href: "/poem", label: "POEM weekly score", icon: ClipboardCheck },
      { href: "/scan", label: "Ingredient scanner", icon: ScanLine },
      { href: "/restaurants", label: "Healthy places to eat", icon: UtensilsCrossed },
    ],
  },
  {
    id: "community",
    title: "Community",
    items: [
      { href: "/community", label: "Community", icon: MessageSquare },
      { href: "/chat", label: "WhatsApp chat", icon: MessagesSquare },
      { href: "/won", label: "Won — stories", icon: Trophy },
      { href: "/protocols", label: "Protocols", icon: BookOpen },
    ],
  },
  {
    id: "lab",
    title: "The Lab",
    items: [
      { href: "/peptides", label: "Peptide tracker", icon: Syringe },
      { href: "/calculator", label: "Calculator", icon: Calculator },
      { href: "/library", label: "Peptide library", icon: Library },
      { href: "/progress", label: "Journal", icon: NotebookPen },
    ],
  },
];

/** Pages reached from the user menu / footer rather than the main nav. */
export const ACCOUNT_ITEMS: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/privacy-sources", label: "Privacy & sources", icon: ShieldCheck },
];

export const ADMIN_ITEM: NavItem = { href: "/admin", label: "Admin CRM", icon: ShieldCheck };

export const ARCHIVES_ITEM: NavItem = { href: "/archives", label: "The Archives", icon: Sparkles };

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

/** "Group › Page" for the topbar, from the current path. */
export function breadcrumbFor(pathname: string): { group: string | null; page: NavItem | null; deeper: boolean } {
  for (const g of NAV_GROUPS) {
    for (const item of g.items) {
      if (isActivePath(pathname, item.href)) {
        return { group: g.title, page: item, deeper: pathname !== item.href };
      }
    }
  }
  for (const item of ACCOUNT_ITEMS) {
    if (isActivePath(pathname, item.href)) return { group: "Account", page: item, deeper: false };
  }
  if (isActivePath(pathname, ARCHIVES_ITEM.href)) return { group: null, page: ARCHIVES_ITEM, deeper: false };
  return { group: null, page: null, deeper: false };
}

export function trackArchivesClick() {
  fetch("/api/funnel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "archives_nav_click" }),
  }).catch(() => {});
}
