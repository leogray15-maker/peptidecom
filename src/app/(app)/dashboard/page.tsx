import Link from "next/link";
import {
  BookOpen,
  Calculator,
  ClipboardCheck,
  ClipboardList,
  ChevronRight,
  CloudSun,
  Compass,
  Hand,
  LifeBuoy,
  LineChart,
  ListChecks,
  Map,
  MessageCircle,
  Plus,
  Ruler,
  ScanEye,
  ScanLine,
  Syringe,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import { ConditionPickerModal } from "@/components/condition-picker";
import {
  FeatureBadgePill,
  FeatureCard,
  type FeatureCardProps,
} from "@/components/feature-card";
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
    href: "/restaurants",
    title: "Healthy places to eat",
    icon: UtensilsCrossed,
    badge: "NEW",
    description:
      "Every restaurant, café and takeaway near you on a map, scored 0–100 for how healthy eating there is likely to be.",
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

  // The ring fills toward the next streak milestone, so it always has
  // somewhere to go — a full ring at 7 would have nothing to say at 8.
  const ringValue = stats.streak > 0 ? stats.streak : stats.daysTracked;
  const nextMilestone = STREAK_MILESTONES.find((m) => m > ringValue) ?? ringValue;
  const ringFraction = ringValue > 0 ? ringValue / nextMilestone : 0;

  return (
    <div>
      {/* One-time onboarding: adapts the whole app to the member's condition.
          Existing (pre-multi-condition) accounts see TSW pre-selected. */}
      {user && !profile.condition && (
        <ConditionPickerModal hasLoggedBefore={logs.length > 0 || !!profile.recoveryStage} />
      )}
      {justSubscribed && <WelcomeBanner name={user?.name?.split(" ")[0]} />}
      <PageHeader
        eyebrow={profile.condition ? condition.label : undefined}
        title={`Welcome back, ${firstName}.`}
        subtitle="However your skin is today, showing up here counts. Here's where you stand."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
          {/* Today — the streak and the three things that change hour to hour,
              each a shortcut to the screen that owns them. */}
          <section aria-label="Today" className="card !rounded-3xl">
            <div className="flex items-center gap-5">
              <StreakRing
                fraction={ringFraction}
                value={ringValue}
                label={
                  stats.streak > 0
                    ? `day streak`
                    : stats.daysTracked > 0
                      ? `day${stats.daysTracked === 1 ? "" : "s"} logged`
                      : "start here"
                }
                gold={stats.streak > 0}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-400">Today</p>
                <p className="mt-0.5 text-lg font-semibold text-white">
                  {todayLogged ? "Logged — nicely done" : "Not logged yet"}
                </p>
                {stats.streakUsedGrace && (
                  <p className="mt-0.5 text-xs text-gold-300">Flare-day pass kept it alive ✦</p>
                )}
                <Link
                  href="/tracker"
                  className={cn(
                    "btn mt-3 w-full rounded-2xl sm:w-auto sm:px-6",
                    todayLogged
                      ? "border border-lab-border bg-lab-raised text-slate-100 hover:border-brand-500/40"
                      : "bg-brand-300 font-bold text-lab-bg hover:bg-brand-200"
                  )}
                >
                  {todayLogged ? (
                    <>Edit today&apos;s log</>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" strokeWidth={2.6} />
                      {stats.daysTracked === 0 ? "Log your first day" : "Log today · 20 sec"}
                    </>
                  )}
                </Link>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-lab-line pt-4 sm:gap-4">
              <Link href="/itch" className="group min-w-0 rounded-xl">
                <p className="text-xs text-slate-400">Itch peak</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-white">
                  {itch.todayPeak != null ? (
                    <>
                      {itch.todayPeak}
                      <span className="text-sm font-medium text-slate-500">/10</span>
                    </>
                  ) : (
                    <span className="text-base text-brand-300 group-hover:text-brand-200">
                      Check in
                    </span>
                  )}
                </p>
                {itch.todayPeak != null && (
                  <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-lab-border">
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        itch.todayPeak >= 7 ? "bg-orange-400" : "bg-brand-400"
                      )}
                      style={{ width: `${itch.todayPeak * 10}%` }}
                    />
                  </span>
                )}
              </Link>
              <Link href="/forecast" className="group min-w-0 rounded-xl">
                <p className="text-xs text-slate-400">Flare risk</p>
                {forecast ? (
                  <>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-white">
                      {forecast.score}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 flex items-center gap-1.5 truncate text-xs font-medium capitalize",
                        forecast.score >= 50 ? "text-orange-300" : "text-emerald-300"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          forecast.score >= 50 ? "bg-orange-300" : "bg-emerald-300"
                        )}
                      />
                      {forecast.band}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-base font-semibold text-brand-300 group-hover:text-brand-200">
                    Check
                  </p>
                )}
              </Link>
              <div className="min-w-0">
                <p className="text-xs text-slate-400">Stage</p>
                {stage ? (
                  <StageSheet
                    stages={condition.stages}
                    currentStageId={profile.recoveryStage ?? null}
                    currentStageName={stage}
                  />
                ) : (
                  <Link
                    href="/timeline"
                    className="mt-1 inline-block text-base font-semibold text-brand-300 hover:text-brand-200"
                  >
                    Mark it
                  </Link>
                )}
              </div>
            </div>
          </section>

          {/* Recovery stats. A bare "0 days" is the single most demoralising
              thing this screen could say to someone mid-flare, so zero never
              renders as a number. */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="card !p-4 sm:!p-5">
              <p className="text-xs text-slate-400 sm:text-sm">Days tracked</p>
              {stats.daysTracked > 0 ? (
                <p className="stat-num mt-2 text-3xl sm:text-4xl">{stats.daysTracked}</p>
              ) : (
                <Link
                  href="/tracker"
                  className="mt-2 inline-block text-sm font-medium text-brand-300 hover:text-brand-200"
                >
                  Start today →
                </Link>
              )}
            </div>
            <div className="card !p-4 sm:!p-5">
              <p className="text-xs text-slate-400 sm:text-sm">Since last bad flare</p>
              <p className="mt-2">
                {stats.daysSinceBadFlare != null ? (
                  <>
                    <span className="stat-num text-3xl sm:text-4xl">{stats.daysSinceBadFlare}</span>
                    <span className="text-sm text-slate-500">
                      {" "}
                      day{stats.daysSinceBadFlare === 1 ? "" : "s"}
                    </span>
                  </>
                ) : stats.daysTracked > 0 ? (
                  <span className="font-display text-xl text-white">None logged ✦</span>
                ) : (
                  <span className="stat-num text-3xl text-slate-600">—</span>
                )}
              </p>
            </div>
          </div>

          {/* Cohort + personal insights */}
          <InsightsPanel personal={personalInsight} cohort={cohortStatements} />
        </div>

        {/* Right rail on wide screens; flows under the stats on phones. */}
        <div className="space-y-4">
          <Link
            href="/support"
            className="card group flex items-center gap-4 !p-4 border-brand-500/30 bg-[#16122a] transition hover:border-brand-500 sm:!p-5"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-500/20 text-brand-300">
              <LifeBuoy className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-white">Today is bad?</span>
              <span className="block text-sm text-slate-400">
                Calming tools, itch coping and the community — no judgement.
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-600 transition group-hover:text-brand-300" />
          </Link>

          <section className="card !p-4 sm:!p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-medium text-white">Latest discussion</h2>
              <Link
                href="/community"
                className="text-sm font-medium text-brand-300 hover:text-brand-200"
              >
                View all
              </Link>
            </div>
            {recentPosts.length === 0 ? (
              <p className="py-2 text-sm text-slate-400">
                No posts yet. Be the first to{" "}
                <Link href="/community" className="text-brand-300 hover:text-brand-200">
                  start a discussion
                </Link>
                .
              </p>
            ) : (
              <ul className="divide-y divide-lab-line">
                {recentPosts.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`/community/${post.id}`}
                      className="group flex items-center justify-between gap-3 py-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-white group-hover:text-brand-100">
                          {post.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {post.category?.name ?? "General"} · {post.author.name} ·{" "}
                          {timeAgo(post.createdAt)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {post._count.comments}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Skin toolkit — validated instruments kept visibly apart from our own
          experimental scoring. */}
      <ToolSection
        title="Validated clinical measures"
        badge="VALIDATED"
        blurb="Published instruments your clinician will recognise, used here as self-tracking tools."
        tools={clinicalTools}
      />
      <ToolSection
        title="Experimental tools"
        badge="EXPERIMENTAL"
        blurb="Our own estimates, built to help you describe what you're seeing. Not validated measures, and never a diagnosis."
        tools={experimentalTools}
      />
      <ToolSection title="Day-to-day tracking" tools={trackingTools} />

      {/* The lab tools */}
      <h2 className="mt-10 text-xl font-medium text-white">The lab</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {labLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="card group flex items-center gap-3 !p-4 transition hover:border-brand-500/50 hover:bg-lab-raised/60"
          >
            <l.icon className="h-4.5 w-4.5 shrink-0 text-brand-300" />
            <span className="text-sm font-medium text-slate-200">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365];

/** Progress ring with the figure set in the display serif. Gold only while a
 * streak is alive — gold is reserved for milestones across the app. */
function StreakRing({
  fraction,
  value,
  label,
  gold,
}: {
  fraction: number;
  value: number;
  label: string;
  gold: boolean;
}) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(1, Math.max(0, fraction)));
  return (
    <div className="relative h-[5.75rem] w-[5.75rem] shrink-0">
      <svg viewBox="0 0 92 92" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="46" cy="46" r={r} fill="none" strokeWidth="7" className="stroke-lab-border" />
        {fraction > 0 && (
          <circle
            cx="46"
            cy="46"
            r={r}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={gold ? "stroke-gold-400" : "stroke-brand-400"}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {value > 0 ? (
          <span className="stat-num text-3xl">{value}</span>
        ) : (
          <span className="font-display text-2xl leading-none text-brand-300">✦</span>
        )}
        <span className="mt-1 text-[11px] text-slate-400">{label}</span>
      </div>
    </div>
  );
}

/** A toolkit section: grouped rows on phones (one card, hairline dividers),
 * a grid of cards from `sm` up where there's room for the descriptions. */
function ToolSection({
  title,
  badge,
  blurb,
  tools,
}: {
  title: string;
  badge?: "VALIDATED" | "EXPERIMENTAL";
  blurb?: string;
  tools: FeatureCardProps[];
}) {
  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-medium text-white">{title}</h2>
        {badge && <FeatureBadgePill badge={badge} />}
      </div>
      {blurb && <p className="mt-1 text-sm text-slate-500">{blurb}</p>}

      <div className="list-group mt-4 sm:hidden">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="flex min-h-16 items-center gap-3.5 px-4 py-3 transition active:bg-white/[0.03]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-300">
              <tool.icon className="h-[1.1rem] w-[1.1rem]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-white">{tool.title}</span>
              <span className="line-clamp-1 text-[13px] text-slate-400">{tool.description}</span>
            </span>
            {tool.badge && tool.badge !== badge ? (
              <FeatureBadgePill badge={tool.badge} />
            ) : (
              <ChevronRight className="h-4.5 w-4.5 shrink-0 text-slate-600" />
            )}
          </Link>
        ))}
      </div>

      <div className="mt-4 hidden gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <FeatureCard key={tool.href} {...tool} badge={tool.badge === badge ? null : tool.badge} />
        ))}
      </div>
    </section>
  );
}
