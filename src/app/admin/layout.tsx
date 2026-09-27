import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getAdminUser } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { DisclaimerLine } from "@/components/disclaimer-bar";
import { SidebarLogo } from "@/components/shell/sidebar";
import { AdminBreadcrumb, AdminMobileNav, AdminNav, BackToAppLink } from "@/components/admin/admin-nav";

// Admin pages are per-request (auth + DB) and must never be prerendered at build.
export const dynamic = "force-dynamic";

export const metadata = { title: { default: "Admin CRM", template: "%s · Admin CRM" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();
  if (!admin) {
    // Signed in but not an admin → back to the app; signed out → login.
    const user = await getCurrentUser();
    redirect(user ? "/dashboard" : "/login?callbackUrl=/admin");
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="sticky top-0 hidden h-screen w-sidebar shrink-0 flex-col border-r border-line-subtle bg-sidebar lg:flex">
        <div className="px-4 pb-3 pt-5">
          <SidebarLogo />
          <p className="mt-3 flex items-center gap-1.5 px-1 text-label font-medium uppercase text-fg-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-accent-strong" aria-hidden /> Admin CRM
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-2">
          <AdminNav />
        </div>
        <div className="border-t border-line-subtle px-3 py-3">
          <BackToAppLink />
          <p className="mt-1 truncate px-2.5 text-[12px] text-fg-muted">{admin.email}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-topbar items-center justify-between gap-3 border-b border-line-subtle bg-canvas px-4 sm:px-6 lg:px-10">
          <AdminBreadcrumb />
          <div className="lg:hidden">
            <BackToAppLink />
          </div>
        </header>
        <main className="w-full min-w-0 flex-1 px-4 pb-8 pt-7 sm:px-6 lg:px-10 lg:pt-9">
          <div className="mx-auto w-full max-w-[1200px]">
            <div className="mb-5 lg:hidden">
              <AdminMobileNav />
            </div>
            {children}
          </div>
        </main>
        <footer className="px-4 pb-6 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[1200px] border-t border-line-subtle pt-4">
            <DisclaimerLine />
          </div>
        </footer>
      </div>
    </div>
  );
}
