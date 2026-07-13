import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  Camera,
  ClipboardList,
  GraduationCap,
  LifeBuoy,
  LineChart,
  ListChecks,
  Map,
  Syringe,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safe } from "@/lib/safe-db";
import { type DailyLog, computeStats, dateKey, stageName } from "@/lib/tsw";
import { type TswProfile, getProfile, listLogs, tswKey } from "@/lib/tsw-db";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

const recoveryLinks = [
  { href: "/tracker", label: "Log today's skin", icon: ClipboardList, desc: "20 seconds. Body map, severity, done." },
  { href: "/photos", label: "Photo timeline", icon: Camera, desc: "Add a photo or compare then vs now." },
  { href: "/timeline", label: "Where am I in this?", icon: Map, desc: "The withdrawal map, stage by stage." },
  { href: "/insights", label: "Your trends", icon: TrendingUp, desc: "Severity, sleep and patterns — your data." },
  { href: "/triggers", label: "Triggers", icon: ListChecks, desc: "Catch what helps and what flares you." },
  { href: "/won", label: "The Won wall", icon: Trophy, desc: "Recovery stories. Proof it gets better." },
];

const labLinks = [
  { href: "/peptides", label: "Peptide tracker", icon: Syringe },
  { href: "/calculator", label: "Calculator", icon: Calculator },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/protocols", label: "Protocols", icon: GraduationCap },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const getRecentPosts = () =>
    prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { author: true, category: true, _count: { select: { comments: true } } },
    });

  const uid = user ? tswKey(user) : null;
  const [recentPosts, logs, profile] = await Promise.all([
    safe(getRecentPosts, [] as Awaited<ReturnType<typeof getRecentPosts>>),
    uid ? safe(() => listLogs(uid), [] as DailyLog[]) : Promise.resolve([] as DailyLog[]),
    uid ? safe(() => getProfile(uid), {} as TswProfile) : Promise.resolve({} as TswProfile),
  ]);

  const stats = computeStats(logs);
  const stage = stageName(profile.recoveryStage);
  const todayLogged = logs.some((l) => l.date === dateKey());
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle="However your skin is today, showing up here counts. Here's where you stand."
      />

      {/* Recovery stats — 2×2 on phones so the overview fits one screen. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="card !p-4 sm:!p-6">
          <p className="text-xs text-slate-400 sm:text-sm">Tracking streak</p>
          <p className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            {stats.streak}
            <span className="text-sm font-normal text-slate-500 sm:text-base"> day{stats.streak === 1 ? "" : "s"}</span>
          </p>
          {!todayLogged && stats.daysTracked > 0 && (
            <Link href="/tracker" className="mt-1 inline-block text-xs text-brand-300 hover:text-brand-200">
              Log today to keep it →
            </Link>
          )}
        </div>
        <div className="card !p-4 sm:!p-6">
          <p className="text-xs text-slate-400 sm:text-sm">Days tracked</p>
          <p className="mt-1 text-2xl font-bold text-white sm:text-3xl">{stats.daysTracked}</p>
        </div>
        <div className="card !p-4 sm:!p-6">
          <p className="text-xs text-slate-400 sm:text-sm">Current stage</p>
          {stage ? (
            <p className="mt-1 text-base font-bold leading-snug text-white sm:text-xl">{stage}</p>
          ) : (
            <Link href="/timeline" className="mt-1 inline-block text-sm font-medium text-brand-300 hover:text-brand-200">
              Mark where you are →
            </Link>
          )}
        </div>
        <div className="card !p-4 sm:!p-6">
          <p className="text-xs text-slate-400 sm:text-sm">Since last bad flare</p>
          <p className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            {stats.daysSinceBadFlare != null ? (
              <>
                {stats.daysSinceBadFlare}
                <span className="text-sm font-normal text-slate-500 sm:text-base"> day{stats.daysSinceBadFlare === 1 ? "" : "s"}</span>
              </>
            ) : stats.daysTracked > 0 ? (
              <span className="text-lg sm:text-xl">None logged ✦</span>
            ) : (
              "—"
            )}
          </p>
        </div>
      </div>

      {/* Flare-day support */}
      <Link
        href="/support"
        className="card group mt-4 flex items-center justify-between border-brand-500/30 bg-gradient-to-r from-brand-950/50 to-lab-card transition hover:border-brand-500"
      >
        <div className="flex items-center gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-500/20 text-brand-300">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-white">Today is bad?</p>
            <p className="text-sm text-slate-400">
              Calming tools, itch coping and the community — all in one place, no judgement.
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:text-brand-300" />
      </Link>

      {/* Quick links */}
      <h2 className="mt-8 text-lg font-semibold text-white">Jump back in</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {recoveryLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="card group !p-4 transition hover:border-brand-600 sm:!p-6"
          >
            {/* Phone: one compact row. Desktop: icon + arrow header, text below. */}
            <div className="flex items-center gap-4 sm:items-start sm:justify-between">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-900/60 text-brand-300">
                <l.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 sm:hidden">
                <p className="font-semibold text-white">{l.label}</p>
                <p className="mt-0.5 text-sm text-slate-400">{l.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:text-brand-300" />
            </div>
            <div className="hidden sm:block">
              <p className="mt-4 font-semibold text-white">{l.label}</p>
              <p className="mt-1 text-sm text-slate-400">{l.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* The lab tools */}
      <h2 className="mt-8 text-lg font-semibold text-white">The lab</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {labLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="card group flex items-center gap-3 !p-4 transition hover:border-brand-600"
          >
            <l.icon className="h-4.5 w-4.5 shrink-0 text-brand-300" />
            <span className="text-sm font-medium text-slate-200">{l.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent discussion */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Latest discussion</h2>
        <Link href="/community" className="text-sm font-medium text-brand-300 hover:text-brand-200">
          View all
        </Link>
      </div>
      <div className="mt-4 space-y-3">
        {recentPosts.length === 0 ? (
          <div className="card text-sm text-slate-400">
            No posts yet. Be the first to{" "}
            <Link href="/community" className="text-brand-300 hover:text-brand-200">
              start a discussion
            </Link>
            .
          </div>
        ) : (
          recentPosts.map((post) => (
            <Link
              key={post.id}
              href={`/community/${post.id}`}
              className="card flex items-center justify-between transition hover:border-brand-600"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{post.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {post.category?.name ?? "General"} · {post.author.name} · {timeAgo(post.createdAt)}
                </p>
              </div>
              <span className="ml-4 shrink-0 text-sm text-slate-400">
                {post._count.comments} 💬
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
