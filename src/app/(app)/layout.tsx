import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, hasAccess } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { AppNav, ArchivesNavLink } from "@/components/app-nav";
import { Avatar } from "@/components/avatar";
import { SignOutButton } from "@/components/sign-out-button";

// Member pages are per-request (auth + DB) and must never be prerendered at build.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/dashboard");
  }
  if (!hasAccess(user)) {
    redirect("/pricing");
  }

  return (
    <div className="min-h-[calc(100vh-2rem)]">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Sidebar */}
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col justify-between rounded-2xl border border-lab-border bg-lab-card p-4 lg:flex">
          <div className="flex min-h-0 flex-1 flex-col">
            <Logo href="/dashboard" />
            <div className="mt-6 min-h-0 flex-1 overflow-y-auto pb-4 pr-1 [scrollbar-width:thin]">
              <AppNav />
            </div>
          </div>
          <div className="border-t border-lab-border pt-3">
            <ArchivesNavLink />
            <Link
              href="/settings"
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
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-lab-border bg-lab-card/95 backdrop-blur lg:hidden">
        <div className="px-2 py-2">
          <AppNav orientation="horizontal" />
        </div>
      </div>
    </div>
  );
}
