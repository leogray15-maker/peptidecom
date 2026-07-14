import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { safe } from "@/lib/safe-db";
import { ACTION_LABEL } from "@/lib/admin";
import { firstParam } from "@/lib/admin-customers";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Activity" };

const PAGE_SIZE = 50;

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(firstParam(sp.page)) || 1);

  const [total, rows] = await Promise.all([
    safe(() => prisma.crmActivity.count(), 0),
    safe(
      () =>
        prisma.crmActivity.findMany({
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          include: { user: { select: { id: true, name: true, email: true } } },
        }),
      []
    ),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Activity log"
        subtitle="Every admin action — role changes, notes, tags and tasks — with who did it and when."
      />

      <div className="card overflow-x-auto !p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-lab-border text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">By</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                  Nothing logged yet. Actions taken in the CRM will show up here.
                </td>
              </tr>
            )}
            {rows.map((a) => (
              <tr key={a.id} className="border-b border-lab-border/60">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                  {formatDate(a.createdAt, { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3">
                  <p className="text-slate-200">{ACTION_LABEL[a.action] ?? a.action}</p>
                  {a.detail && <p className="mt-0.5 text-xs text-slate-500">{a.detail}</p>}
                </td>
                <td className="px-4 py-3">
                  {a.user ? (
                    <Link href={`/admin/customers/${a.user.id}`} className="text-brand-300 hover:text-brand-200">
                      {a.user.name ?? a.user.email}
                    </Link>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">{a.actorEmail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <p>
            Page {page} of {pages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/activity?page=${page - 1}`} className="btn-secondary !px-3 !py-2">
                <ChevronLeft className="h-4 w-4" /> Prev
              </Link>
            )}
            {page < pages && (
              <Link href={`/admin/activity?page=${page + 1}`} className="btn-secondary !px-3 !py-2">
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
