import Link from "next/link";
import { ChevronLeft, ChevronRight, Crown } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/avatar";
import { prisma } from "@/lib/prisma";
import { safe } from "@/lib/safe-db";
import { lifecycleStage } from "@/lib/admin";
import { customerOrderBy, customerWhere, firstParam } from "@/lib/admin-customers";
import { CustomersFilters } from "@/components/admin/customers-filters";
import { CompBadge, RoleBadge, StageBadge, SubscriptionBadge, TagBadge } from "@/components/admin/badges";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Customers" };

const PAGE_SIZE = 25;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = {
    q: firstParam(sp.q),
    status: firstParam(sp.status),
    role: firstParam(sp.role),
    tag: firstParam(sp.tag),
    sort: firstParam(sp.sort),
  };
  const page = Math.max(1, Number(firstParam(sp.page)) || 1);

  const where = customerWhere(params);
  const [total, users] = await Promise.all([
    safe(() => prisma.user.count({ where }), 0),
    safe(
      () =>
        prisma.user.findMany({
          where,
          orderBy: customerOrderBy(params.sort),
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          include: { _count: { select: { posts: true, comments: true, crmNotes: true } } },
        }),
      []
    ),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageLink = (p: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) next.set(k, v);
    if (p > 1) next.set("page", String(p));
    const qs = next.toString();
    return `/admin/customers${qs ? `?${qs}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${total.toLocaleString("en-GB")} ${total === 1 ? "person" : "people"} in this view.`}
      />

      <CustomersFilters />

      {params.tag && (
        <p className="mb-3 text-sm text-slate-400">
          Filtering by tag <TagBadge tag={params.tag} />{" "}
          <Link href={pageLink(1).replace(`tag=${encodeURIComponent(params.tag)}`, "").replace(/[?&]$/, "")} className="text-brand-300 hover:text-brand-200">
            clear
          </Link>
        </p>
      )}

      <div className="card overflow-x-auto !p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-lab-border text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Billing</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium">Activity</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No customers match this view.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-lab-border/60 transition hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${u.id}`} className="flex items-center gap-3">
                    <Avatar name={u.name} image={u.image} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 font-medium text-white">
                        <span className="truncate">{u.name ?? "—"}</span>
                        {u.foundingMember && <Crown className="h-3.5 w-3.5 shrink-0 text-gold-400" aria-label="Founding member" />}
                        <RoleBadge role={u.role} />
                      </span>
                      <span className="block truncate text-xs text-slate-500">{u.email}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StageBadge stage={lifecycleStage(u)} manual={!!u.crmStage} />
                </td>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap gap-1">
                    <SubscriptionBadge status={u.subscriptionStatus} />
                    {u.comped && <CompBadge />}
                  </span>
                </td>
                <td className="max-w-44 px-4 py-3">
                  <span className="flex flex-wrap gap-1">
                    {u.crmTags.slice(0, 3).map((t) => (
                      <TagBadge key={t} tag={t} />
                    ))}
                    {u.crmTags.length > 3 && (
                      <span className="text-xs text-slate-500">+{u.crmTags.length - 3}</span>
                    )}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                  {u._count.posts} posts · {u._count.comments} comments
                  {u._count.crmNotes > 0 && <> · {u._count.crmNotes} notes</>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                  {formatDate(u.createdAt)}
                </td>
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
              <Link href={pageLink(page - 1)} className="btn-secondary !px-3 !py-2">
                <ChevronLeft className="h-4 w-4" /> Prev
              </Link>
            )}
            {page < pages && (
              <Link href={pageLink(page + 1)} className="btn-secondary !px-3 !py-2">
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
