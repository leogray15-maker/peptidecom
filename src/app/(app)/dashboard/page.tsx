import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  ClipboardCheck,
  ClipboardList,
  CloudSun,
  Compass,
  Hand,
  LifeBuoy,
  LineChart,
  ListChecks,
  Map,
  Ruler,
  ScanEye,
  ScanLine,
  Syringe,
  TrendingUp,
} from "lucide-react";
import { ConditionPickerModal } from "@/components/condition-picker";
import { FeatureCard, type FeatureCardProps } from "@/components/feature-card";
import { InsightsPanel } from "@/components/insights-panel";
import { PageHeader } from "@/components/page-header";
import { StageSheet } from "@/components/stage-sheet";
import { WelcomeBanner } from "@/components/welcome-banner";
import { getCurrentUser } from "@/lib/auth";
import { anyStageName, getCondition } from "@/lib/conditions";
import {
  buildCohortStatements,
  computePersonalInsight,
  rotateStatements,
  weeksSinceStart,
} from "@/lib/insights";
import { getLatestAggregates } from "@/lib/insights-db";
import { prisma } from "@/lib/prisma";
import { safe } from "@/lib/safe-db";
import { type DailyLog, computeStats, dateKey, summariseItch } from "@/lib/tsw";
import {
  type ItchLog,
  type SavedForecast,
  type TriggerLog,
  type TswProfile,
  getForecast,
  getProfile,
  listItchLogs,
  listLogs,
  listTriggers,
  tswKey,
} from "@/lib/tsw-db";
import { cn, timeAgo } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

// The skin toolkit, split by how much the numbers can be trusted.
//
// The split is the point: EASI and POEM are published, validated instruments a
// clinician recognises, while flare grading and the scanner are our own
// heuristics. Mixing them in one grid quietly borrows the credibility of the
// first group for the second, so they get separate headings and separate
// badges — VALIDATED vs EXPERIMENTAL.
const clinicalTools: FeatureCardProps[] = [
  {
    href: "/easi",
    title: "EASI calculator",
    icon: Ruler,
    badge: "VALIDATED",
    description:
      "Score your Eczema Area & Severity Index — the published measure dermatologists use.",
  },
  {
    href: "/poem",
    title: "POEM weekly score",
    icon: ClipboardCheck,
    badge: "VALIDATED",
    description:
      "The validated 7-question weekly measure. Track your week-on-week trend and share it with your clinician.",
  },
];

const experimentalTools: FeatureCardProps[] = [
  {
    href: "/coach",
    title: "Coach",
    icon: Compass,
    badge: "NEW",
    description:
      "Today's plan, built from your own logs — what's worth doing now and what your data is saying.",
  },
  {
    href: "/forecast",
    title: "Flare forecast",
    icon: CloudSun,
    badge: "NEW",
    description:
      "Local humidity, cold, wind and pollen scored against your condition, with today's tips.",
  },
  {
    href: "/itch",
    title: "Itch check-in",
    icon: Hand,
    badge: "NEW",
    description:
      "One tap whenever it bites. Over a week it shows you the hour your itch actually peaks.",
  },
  {
    href: "/grade",
    title: "AI Flare Grading",
    icon: ScanEye,
    badge: "BETA",
    description:
      "Photograph an itchy patch for an on-device estimate of how inflamed it looks — to help you describe a flare to a clinician. An estimate, not a diagnosis.",
  },
  {
    href: "/scan",
    title: "Product scanner",
    icon: ScanLine,
    badge: "EXPERIMENTAL",
    description:
      "Scan any barcode — skincare scored for sensitive skin, food & drink scored on nutrition. Our own scoring, not a clinical measure.",
  },
];

const trackingTools: FeatureCardProps[] = [
  {
    href: "/tracker",
    title: "Daily tracker",
    icon: ClipboardList,
    description: "20 seconds. Body map, severity, symptoms, sleep and mood — done.",
  },
  {
    href: "/timeline",
    title: "Where am I in this?",
    icon: Map,
    description: "Your recovery journey mapped, stage by stage, so this place can meet you there.",
  },
  {
    href: "/insights",
    title: "Your trends",
    icon: TrendingUp,
    description: "Severity, sleep and patterns surfaced gently from your own logged data.",
  },
  {
    href: "/triggers",
    title: "Triggers",
    icon: ListChecks,
    description: "Log products, foods, weather and stress — and catch what flares you.",
  },
];

const labLinks = [
  { href: "/peptides", label: "Peptide tracker", icon: Syringe },
  { href: "/calculator", label: "Calculator", icon: Calculator },
  { href: "/library", label: "Peptide library", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: LineChart },
];

export default async function DashboardPage({
  searchParams,
}: {
  // `welcome=1` is set by the post-checkout redirect; `checkout=success` is the
  // older success_url, still honoured so links already out there keep working.
  searchParams: Promise<{ welcome?: string; checkout?: string }>;
}) {
  const { welcome, checkout } = await searchParams;
  const justSubscribed = welcome === "1" || checkout === "success";
  const user = await getCurrentUser();

  const getRecentPosts = () =>
    prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { author: true, category: true, _count: { select: { comments: true } } },
    });

  const uid = user ? tswKey(user) : null;
  const today = dateKey();
  const [recentPosts, logs, profile, triggers, aggregates, itchLogs, forecast] = await Promise.all([
    safe(getRecentPosts, [] as Awaited<ReturnType<typeof getRecentPosts>>),
    uid ? safe(() => listLogs(uid), [] as DailyLog[]) : Promise.resolve([] as DailyLog[]),
    uid ? safe(() => getProfile(uid), {} as TswProfile) : Promise.resolve({} as TswProfile),
    uid ? safe(() => listTriggers(uid), [] as TriggerLog[]) : Promise.resolve([] as TriggerLog[]),
    safe(getLatestAggregates, null),
    uid ? safe(() => listItchLogs(uid, 60), [] as ItchLog[]) : Promise.resolve([] as ItchLog[]),
    uid
      ? safe(() => getForecast(uid, today), null as SavedForecast | null)
      : Promise.resolve(null as SavedForecast | null),
  ]);

  const stats = computeStats(logs);
  const condition = getCondition(profile.condition);
  const stage = anyStageName(profile.recoveryStage, profile.condition);
  const todayLogged = logs.some((l) => l.date === today);
  const itch = summariseItch(itchLogs, today);
  const firstName = user?.name?.split(" ")[0] ?? "there";

  // Insights: the member's own strongest pattern + rotating cohort stats
  // (aggregated nightly, never per-request — see /api/cron/aggregate).
  const personalInsight = computePersonalInsight(logs, triggers, dateKey());
  const cohortStatements = aggregates
    ? rotateStatements(
        buildCohortStatements(aggregates, {
          stage: profile.recoveryStage,
          weeksSinceStart: weeksSinceStart(logs, profile, dateKey()),
          condition: profile.condition,
        }),
        personalInsight ? 3 : 4
      )
    : [];

  return (
    <div>
      {/* One-time onboarding: adapts the whole app to the member's condition.
          Existing (pre-multi-condition) accounts see TSW pre-selected. */}
      {user && !profile.condition && (
        <ConditionPickerModal hasLoggedBefore={logs.length > 0 || !!profile.recoveryStage} />
      )}
      {justSubscribed && <WelcomeBanner name={user?.name?.split(" ")[0]} />}
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle="However your skin is today, showing up here counts. Here's where you stand."
      />

      {/* Today at a glance — the three things that change hour to hour, each a
          shortcut to the screen that owns them. */}
      <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
        {[
          {
            href: "/tracker",
            label: "Today",
            value: todayLogged ? "Logged ✓" : "Log it",
            hot: !todayLogged,
          },
          {
            href: "/itch",
            label: "Itch peak",
            value: itch.todayPeak != null ? `${itch.todayPeak}/10` : "Check in",
            hot: (itch.todayPeak ?? 0) >= 7,
          },
          {
            href: "/forecast",
            label: "Flare risk",
            value: forecast ? `${forecast.score} ${forecast.band}` : "Check",
            hot: (forecast?.score ?? 0) >= 50,
          },
        ].map((chip) => (
          <Link
            key={chip.href}
            href={chip.href}
            className={cn(
              "card !rounded-2xl !p-3 text-center transition hover:border-brand-500/60",
              chip.hot && "border-brand-500/50 bg-brand-500/10"
            )}
          >
            <p className="text-[11px] text-slate-400">{chip.label}</p>
            <p className="mt-0.5 truncate text-sm font-bold text-white">{chip.value}</p>
          </Link>
        ))}
      </div>

      {/* Recovery stats — 2×2 on phones so the overview fits one screen. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Streak. A bare "0 days" is the single most demoralising thing this
            screen could say to someone mid-flare, so zero never renders as a
            number — it becomes total-days-logged or a plain invitation. */}
        <div className="card !p-4 sm:!p-6">
          <p className="text-xs text-slate-400 sm:text-sm">
            {stats.streak > 0 ? "Tracking streak" : "Your tracking"}
          </p>
          {stats.streak > 0 ? (
            <>
              <p className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                {stats.streak}
                <span className="text-sm font-normal text-slate-500 sm:text-base">
                  {" "}
                  day{stats.streak === 1 ? "" : "s"}
                </span>
              </p>
              {stats.streakUsedGrace && (
                <p className="mt-1 text-xs text-gold-300">Flare-day pass kept it alive ✦</p>
              )}
              {!todayLogged && (
                <Link
                  href="/tracker"
                  className="mt-1 inline-block text-xs text-brand-300 hover:text-brand-200"
                >
                  Log today to keep it →
                </Link>
              )}
            </>
          ) : stats.daysTracked > 0 ? (
            <>
              <p className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                {stats.daysTracked}
                <span className="text-sm font-normal text-slate-500 sm:text-base"> day{stats.daysTracked === 1 ? "" : "s"} logged</span>
              </p>
              <Link
                href="/tracker"
                className="mt-1 inline-block text-xs text-brand-300 hover:text-brand-200"
              >
                {todayLogged ? "Every day counts →" : "Pick it back up today →"}
              </Link>
            </>
          ) : (
            <Link
              href="/tracker"
              className="mt-1 inline-block text-sm font-medium text-brand-300 hover:text-brand-200"
            >
              Log your first day →
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
            <StageSheet
              stages={condition.stages}
              currentStageId={profile.recoveryStage ?? null}
              currentStageName={stage}
            />
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

      {/* Cohort + personal insights */}
      <InsightsPanel personal={personalInsight} cohort={cohortStatements} />

      {/* Skin toolkit — validated instruments kept visibly apart from our own
          experimental scoring. */}
      <h2 className="mt-8 text-lg font-semibold text-white">Validated clinical measures</h2>
      <p className="mt-1 text-sm text-slate-500">
        Published instruments your clinician will recognise, used here as self-tracking tools.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4">
        {clinicalTools.map((tool) => (
          <FeatureCard key={tool.href} {...tool} />
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-white">Experimental tools</h2>
      <p className="mt-1 text-sm text-slate-500">
        Our own estimates, built to help you describe what you&apos;re seeing. Not validated
        measures, and never a diagnosis.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4">
        {experimentalTools.map((tool) => (
          <FeatureCard key={tool.href} {...tool} />
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-white">Day-to-day tracking</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4">
        {trackingTools.map((tool) => (
          <FeatureCard key={tool.href} {...tool} />
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
