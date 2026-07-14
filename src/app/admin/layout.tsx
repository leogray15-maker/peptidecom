import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getAdminUser } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { AdminMobileNav, AdminNav, BackToAppLink } from "@/components/admin/admin-nav";

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
    <div className="min-h-[calc(100vh-2rem)]">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 pb-16 pt-4 sm:px-6 lg:px-8 lg:py-6">
        {/* Sidebar */}
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col justify-between rounded-2xl border border-lab-border bg-lab-card p-4 lg:flex">
          <div>
            <Logo href="/admin" />
            <p className="mt-2 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-300">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin CRM
            </p>
            <div className="mt-6">
              <AdminNav />
            </div>
          </div>
          <div className="border-t border-lab-border pt-3">
            <BackToAppLink />
            <p className="mt-2 truncate px-3 text-xs text-slate-500">{admin.email}</p>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {/* Mobile header + tabs */}
          <div className="mb-4 lg:hidden">
            <div className="mb-3 flex items-center justify-between">
              <Logo href="/admin" />
              <span className="badge bg-brand-500/15 text-brand-200">
                <ShieldCheck className="h-3.5 w-3.5" /> Admin
              </span>
            </div>
            <AdminMobileNav />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
