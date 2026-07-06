import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Crown, ExternalLink, BadgeCheck } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { prisma } from "@/lib/prisma";
import { safe } from "@/lib/safe-db";
import { ACTION_LABEL, lifecycleStage } from "@/lib/admin";
import { CompBadge, RoleBadge, StageBadge, SubscriptionBadge, TagBadge } from "@/components/admin/badges";
import { CustomerEditor } from "@/components/admin/customer-editor";
import { NotesPanel } from "@/components/admin/notes-panel";
import { TasksPanel, type TaskItem } from "@/components/admin/tasks-panel";
import { formatDate, timeAgo } from "@/lib/utils";

export const metadata = { title: "Customer" };

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await safe(
    () =>
      prisma.user.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              posts: true,
              comments: true,
              progressLogs: true,
              protocols: true,
              vendorReviews: true,
            },
          },
          crmNotes: { orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], take: 50 },
          crmTasks: {
            orderBy: [{ status: "asc" }, { dueAt: { sort: "asc", nulls: "last" } }],
            take: 30,
          },
          crmActivities: { orderBy: { createdAt: "desc" }, take: 10 },
          posts: { orderBy: { createdAt: "desc" }, take: 3, select: { id: true, title: true, createdAt: true } },
        },
      }),
    null
  );

  if (!user) notFound();

  const stage = lifecycleStage(user);
  const stats = [
    { label: "Joined", value: formatDate(user.createdAt) },
    { label: "Reputation", value: String(user.reputation) },
    { label: "Posts", value: String(user._count.posts) },
    { label: "Comments", value: String(user._count.comments) },
    { label: "Journal entries", value: String(user._count.progressLogs) },
    { label: "Protocols", value: String(user._count.protocols) },
  ];

  const tasks: TaskItem[] = user.crmTasks.map((t) => ({
    id: t.id,
    title: t.title,
    details: t.details,
    status: t.status,
    priority: t.priority,
    dueAt: t.dueAt?.toISOString() ?? null,
    user: null,
  }));

  return (
    <div>
      <Link
        href="/admin/customers"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" /> All customers
      </Link>

      {/* Header */}
      <div className="card mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} image={user.image} className="h-14 w-14 text-lg" />
            <div>
              <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold text-white">
                {user.name ?? "Unnamed"}
                {user.verified && <BadgeCheck className="h-5 w-5 text-brand-300" aria-label="Verified" />}
                {user.foundingMember && <Crown className="h-5 w-5 text-gold-400" aria-label="Founding member" />}
              </h1>
              <p className="text-sm text-slate-400">
                {user.email}
                {user.username && <> · @{user.username}</>}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <StageBadge stage={stage} manual={!!user.crmStage} />
                <SubscriptionBadge status={user.subscriptionStatus} />
                {user.comped && <CompBadge />}
                <RoleBadge role={user.role} />
                {user.crmTags.map((t) => (
                  <Link key={t} href={`/admin/customers?tag=${encodeURIComponent(t)}`}>
                    <TagBadge tag={t} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {user.stripeCustomerId && (
            <a
              href={`https://dashboard.stripe.com/customers/${user.stripeCustomerId}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
            >
              Stripe customer <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* Billing summary */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-lab-border pt-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Subscription</p>
            <p className="mt-0.5 text-slate-200">
              {user.subscriptionStatus === "NONE" ? "None" : user.subscriptionStatus.toLowerCase().replace("_", " ")}
              {user.foundingMember && " · founding price"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Renews / ends</p>
            <p className="mt-0.5 text-slate-200">
              {user.stripeCurrentPeriodEnd ? formatDate(user.stripeCurrentPeriodEnd) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Last contacted</p>
            <p className="mt-0.5 text-slate-200">
              {user.lastContactedAt ? formatDate(user.lastContactedAt) : "Never"}
            </p>
          </div>
        </div>
      </div>

      {/* Engagement stats */}
      <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="card !p-3 text-center">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="mt-0.5 text-sm font-semibold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <CustomerEditor
            customer={{
              id: user.id,
              role: user.role,
              verified: user.verified,
              comped: user.comped,
              crmStage: user.crmStage,
              crmTags: user.crmTags,
              lastContactedAt: user.lastContactedAt?.toISOString() ?? null,
            }}
          />

          <TasksPanel userId={user.id} tasks={tasks} title="Follow-ups" />

          {/* Recent forum posts */}
          {user.posts.length > 0 && (
            <div className="card">
              <h2 className="mb-3 font-semibold text-white">Recent posts</h2>
              <div className="space-y-2">
                {user.posts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/community/${p.id}`}
                    className="block rounded-xl border border-lab-border bg-lab-bg p-3 transition hover:border-brand-600"
                  >
                    <p className="truncate text-sm font-medium text-white">{p.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{timeAgo(p.createdAt)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <NotesPanel
            userId={user.id}
            notes={user.crmNotes.map((n) => ({
              id: n.id,
              body: n.body,
              authorEmail: n.authorEmail,
              pinned: n.pinned,
              createdAt: n.createdAt.toISOString(),
            }))}
          />

          {/* Per-customer audit trail */}
          <div className="card">
            <h2 className="mb-3 font-semibold text-white">History</h2>
            {user.crmActivities.length === 0 ? (
              <p className="text-sm text-slate-400">No admin actions on this customer yet.</p>
            ) : (
              <div className="space-y-2">
                {user.crmActivities.map((a) => (
                  <div key={a.id} className="flex items-baseline justify-between gap-4 text-sm">
                    <p className="min-w-0 truncate text-slate-300">
                      {ACTION_LABEL[a.action] ?? a.action}
                      {a.detail && <span className="text-slate-500"> · {a.detail}</span>}
                    </p>
                    <p className="shrink-0 text-xs text-slate-500">{timeAgo(a.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
