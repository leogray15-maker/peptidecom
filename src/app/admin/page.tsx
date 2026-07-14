import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Crown,
  PoundSterling,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/avatar";
import { prisma } from "@/lib/prisma";
import { safe } from "@/lib/safe-db";
import { ACTION_LABEL, lifecycleStage } from "@/lib/admin";
import { FOUNDING_PRICE, STANDARD_PRICE } from "@/lib/membership";
import { StageBadge, SubscriptionBadge, PriorityBadge } from "@/components/admin/badges";
import { SignupsChart, type SignupPoint } from "@/components/admin/signups-chart";
import { formatDate, timeAgo } from "@/lib/utils";

export const metadata = { title: "Overview" };

const WEEKS = 12;

function weekStart(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const day = (out.getDay() + 6) % 7; // Monday = 0
  out.setDate(out.getDate() - day);
  return out;
}

export default async function AdminOverviewPage() {
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const chartFrom = weekStart(new Date(Date.now() - (WEEKS - 1) * 7 * 24 * 60 * 60 * 1000));

  const [
    totalUsers,
    activeSubs,
    foundingActive,
    pastDue,
    new30d,
    openTasks,
    signupDates,
    recentUsers,
    dueTasks,
    recentActivity,
  ] = await Promise.all([
    safe(() => prisma.user.count(), 0),
    safe(() => prisma.user.count({ where: { subscriptionStatus: { in: ["ACTIVE", "TRIALING"] } } }), 0),
    safe(
      () =>
        prisma.user.count({
          where: { foundingMember: true, subscriptionStatus: { in: ["ACTIVE", "TRIALING"] } },
        }),
      0
    ),
    safe(() => prisma.user.count({ where: { subscriptionStatus: "PAST_DUE" } }), 0),
    safe(() => prisma.user.count({ where: { createdAt: { gte: since30d } } }), 0),
    safe(() => prisma.crmTask.count({ where: { status: "OPEN" } }), 0),
    safe(
      () =>
        prisma.user.findMany({
          where: { createdAt: { gte: chartFrom } },
          select: { createdAt: true },
        }),
      [] as { createdAt: Date }[]
    ),
    safe(
      () =>
        prisma.user.findMany({
          take: 6,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
            crmStage: true,
            subscriptionStatus: true,
          },
        }),
      []
    ),
    safe(
      () =>
        prisma.crmTask.findMany({
          where: { status: "OPEN" },
          take: 5,
          orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
          include: { user: { select: { id: true, name: true, email: true } } },
        }),
      []
    ),
    safe(
      () =>
        prisma.crmActivity.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, name: true, email: true } } },
        }),
      []
    ),
  ]);

  // Estimated MRR from display prices (real numbers live in Stripe).
  const mrr = foundingActive * FOUNDING_PRICE + (activeSubs - foundingActive) * STANDARD_PRICE;

  // Bucket signups into ISO weeks for the chart.
  const buckets = new Map<number, number>();
  for (let i = 0; i < WEEKS; i++) {
    const ws = new Date(chartFrom);
    ws.setDate(ws.getDate() + i * 7);
    buckets.set(ws.getTime(), 0);
  }
  for (const { createdAt } of signupDates) {
    const key = weekStart(createdAt).getTime();
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const chartData: SignupPoint[] = [...buckets.entries()].map(([ts, signups]) => ({
    label: formatDate(new Date(ts), { year: undefined }),
    signups,
  }));

  const kpis = [
    { label: "Total users", value: String(totalUsers), icon: Users },
    { label: "Active members", value: String(activeSubs), icon: Zap },
    { label: "Est. MRR", value: `£${mrr.toLocaleString("en-GB")}`, icon: PoundSterling },
    { label: "Founding members", value: String(foundingActive), icon: Crown },
    { label: "New (30 days)", value: String(new30d), icon: UserPlus },
    { label: "Open tasks", value: String(openTasks), icon: CalendarClock },
  ];

  return (
    <div>
      <PageHeader
        title="CRM overview"
        subtitle="Your members, revenue and follow-ups at a glance."
        action={
          <Link href="/admin/customers" className="btn-primary">
            Customers <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="card !p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <k.icon className="h-4 w-4 text-brand-300" />
              <p className="text-xs sm:text-sm">{k.label}</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-white">{k.value}</p>
          </div>
        ))}
      </div>

      {pastDue > 0 && (
        <Link
          href="/admin/customers?status=past_due"
          className="card mt-4 flex items-center justify-between border-amber-500/30 transition hover:border-amber-500"
        >
          <p className="text-sm text-amber-200">
            <span className="font-semibold">{pastDue}</span> member{pastDue === 1 ? "" : "s"} past
            due — worth a follow-up before they churn.
          </p>
          <ArrowRight className="h-4 w-4 shrink-0 text-amber-300" />
        </Link>
      )}

      {/* Signups chart */}
      <div className="card mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-white">Signups per week</h2>
          <p className="text-xs text-slate-500">last {WEEKS} weeks</p>
        </div>
        <SignupsChart data={chartData} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Recent signups */}
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-white">Newest customers</h2>
            <Link href="/admin/customers" className="text-sm font-medium text-brand-300 hover:text-brand-200">
              View all
            </Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-slate-400">No users yet.</p>
          ) : (
            <div className="space-y-1">
              {recentUsers.map((u) => (
                <Link
                  key={u.id}
                  href={`/admin/customers/${u.id}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/5"
                >
                  <Avatar name={u.name} image={u.image} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{u.name ?? u.email}</p>
                    <p className="truncate text-xs text-slate-500">
                      {u.email} · {timeAgo(u.createdAt)}
                    </p>
                  </div>
                  <StageBadge stage={lifecycleStage(u)} manual={!!u.crmStage} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Tasks due */}
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-white">Next follow-ups</h2>
            <Link href="/admin/tasks" className="text-sm font-medium text-brand-300 hover:text-brand-200">
              All tasks
            </Link>
          </div>
          {dueTasks.length === 0 ? (
            <p className="text-sm text-slate-400">Nothing pending. Add follow-ups from a customer page.</p>
          ) : (
            <div className="space-y-1">
              {dueTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                  <PriorityBadge priority={t.priority} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{t.title}</p>
                    <p className="truncate text-xs text-slate-500">
                      {t.user ? (
                        <Link href={`/admin/customers/${t.user.id}`} className="hover:text-brand-300">
                          {t.user.name ?? t.user.email}
                        </Link>
                      ) : (
                        "General"
                      )}
                      {t.dueAt && <> · due {formatDate(t.dueAt)}</>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent admin activity */}
      <div className="card mt-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-white">Recent activity</h2>
          <Link href="/admin/activity" className="text-sm font-medium text-brand-300 hover:text-brand-200">
            Full log
          </Link>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-slate-400">No admin activity recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-baseline justify-between gap-4 text-sm">
                <p className="min-w-0 truncate text-slate-300">
                  <span className="text-white">{ACTION_LABEL[a.action] ?? a.action}</span>
                  {a.user && (
                    <>
                      {" — "}
                      <Link href={`/admin/customers/${a.user.id}`} className="text-brand-300 hover:text-brand-200">
                        {a.user.name ?? a.user.email}
                      </Link>
                    </>
                  )}
                  {a.detail && <span className="text-slate-500"> · {a.detail}</span>}
                </p>
                <p className="shrink-0 text-xs text-slate-500">{timeAgo(a.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
