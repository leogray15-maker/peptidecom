import Link from "next/link";
import {
  Camera,
  Check,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  CloudSun,
  Compass,
  Flame,
  Hand,
  LifeBuoy,
  ListChecks,
  MessageCircle,
  Ruler,
  ScanEye,
  ScanLine,
  UtensilsCrossed,
} from "lucide-react";
import { ConditionPickerModal } from "@/components/condition-picker";
import { ContinueProtocol } from "@/components/dashboard/continue-protocol";
import { Greeting, TodayEyebrow } from "@/components/dashboard/greeting";
import { SeverityTrend } from "@/components/dashboard/severity-trend";
import { FeatureBadgePill, type FeatureBadge } from "@/components/feature-card";
import { InsightsPanel } from "@/components/insights-panel";
import { PageHeader } from "@/components/page-header";
import { StageSheet } from "@/components/stage-sheet";
import { WelcomeBanner } from "@/components/welcome-banner";
import {
  ButtonLink,
  CardHeader,
  EmptyState,
  ProgressBar,
  SCORE_COLOR,
  ScoreBadge,
  StatCard,
  toneLevel,
} from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { anyStageName, getCondition } from "@/lib/conditions";
import { riskBand } from "@/lib/forecast";
import {
  buildCohortStatements,
  computePersonalInsight,
  rotateStatements,
  weeksSinceStart,
} from "@/lib/insights";
import { getLatestAggregates } from "@/lib/insights-db";
import { POEM_MAX, poemBand } from "@/lib/poem";
import { prisma } from "@/lib/prisma";
import { LIBRARY } from "@/lib/protocols";
import { safe } from "@/lib/safe-db";
import { score, severityLevel, severityWord } from "@/lib/tokens";
import { type DailyLog, computeStats, dateKey, daysBetween, summariseItch } from "@/lib/tsw";
import {
  type ItchLog,
  type SavedForecast,
  type StoredHistoryEntry,
  type TriggerLog,
  type TswProfile,
  getForecast,
  getHistory,
  getProfile,
  lastPhotoDate,
  listItchLogs,
  listLogs,
  listTriggers,
  tswKey,
} from "@/lib/tsw-db";
import { cn, sentenceCase, timeAgo } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

// The skin toolkit, split by how much the numbers can be trusted: EASI and
// POEM are published, validated instruments; the rest are our own heuristics.
// Kept visibly apart so the second group never borrows the first's credibility.
const TOOLKIT: { title: string; badge: "VALIDATED" | "EXPERIMENTAL"; blurb: string; tools: { href: string; title: string; icon: React.ElementType; badge?: FeatureBadge }[] }[] = [
  {
    title: "Validated clinical measures",
    badge: "VALIDATED",
    blurb: "Published instruments your clinician will recognise.",
    tools: [
      { href: "/easi", title: "EASI calculator", icon: Ruler },
      { href: "/poem", title: "POEM weekly score", icon: ClipboardCheck },
    ],
  },
  {
    title: "Experimental tools",
    badge: "EXPERIMENTAL",
    blurb: "Our own estimates. Not validated measures, never a diagnosis.",
    tools: [
      { href: "/coach", title: "Coach", icon: Compass, badge: "NEW" },
      { href: "/forecast", title: "Flare forecast", icon: CloudSun, badge: "NEW" },
      { href: "/grade", title: "AI flare grading", icon: ScanEye, badge: "BETA" },
      { href: "/scan", title: "Ingredient scanner", icon: ScanLine },
      { href: "/restaurants", title: "Healthy places to eat", icon: UtensilsCrossed, badge: "NEW" },
    ],
  },
];

function shiftKey(today: string, days: number) {
  const [y, m, d] = today.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - days)).toISOString().slice(0, 10);
}

function mean(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

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
  const none = <T,>(v: T) => Promise.resolve(v);
  const [recentPosts, logs, profile, triggers, aggregates, itchLogs, forecast, poemHistory, lastPhoto] =
    await Promise.all([
      safe(getRecentPosts, [] as Awaited<ReturnType<typeof getRecentPosts>>),
      uid ? safe(() => listLogs(uid), [] as DailyLog[]) : none([] as DailyLog[]),
      uid ? safe(() => getProfile(uid), {} as TswProfile) : none({} as TswProfile),
      uid ? safe(() => listTriggers(uid), [] as TriggerLog[]) : none([] as TriggerLog[]),
      safe(getLatestAggregates, null),
      uid ? safe(() => listItchLogs(uid, 60), [] as ItchLog[]) : none([] as ItchLog[]),
      uid ? safe(() => getForecast(uid, today), null as SavedForecast | null) : none(null as SavedForecast | null),
      uid ? safe(() => getHistory(uid, "poem"), [] as StoredHistoryEntry[]) : none([] as StoredHistoryEntry[]),
      uid ? safe(() => lastPhotoDate(uid), null as string | null) : none(null as string | null),
    ]);

  const stats = computeStats(logs);
  const condition = getCondition(profile.condition);
  const stage = anyStageName(profile.recoveryStage, profile.condition);
  const todayLog = logs.find((l) => l.date === today) ?? null;
  const itch = summariseItch(itchLogs, today);
  const firstName = user?.name?.split(" ")[0] ?? "there";

  // 7-day average vs the 7 days before it (lower severity is better).
  const inWindow = (from: number, to: number) =>
    logs
      .filter((l) => l.date >= shiftKey(today, to) && l.date <= shiftKey(today, from))
      .map((l) => l.severity);
  const avgThis = mean(inWindow(0, 6));
  const avgPrev = mean(inWindow(7, 13));
  const avgDelta = avgThis != null && avgPrev != null ? Math.round((avgThis - avgPrev) * 10) / 10 : null;

  const latestPoem = poemHistory.length ? poemHistory[poemHistory.length - 1] : null;
  const poem = latestPoem ? { score: latestPoem.score, band: poemBand(latestPoem.score), at: latestPoem.at } : null;

  // Top triggers: things logged as having flared the member, last 90 days.
  const flareCounts = new Map<string, number>();
  for (const t of triggers) {
    if (t.effect === -1 && daysBetween(t.date, today) <= 90) {
      const key = t.name.trim();
      flareCounts.set(key, (flareCounts.get(key) ?? 0) + 1);
    }
  }
  const topTriggers = [...flareCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topMax = topTriggers[0]?.[1] ?? 1;

  const checklist = [
    {
      href: "/itch",
      label: "Itch check-in",
      icon: Hand,
      done: itch.todayPeak != null,
      meta: itch.todayPeak != null ? `Peak ${itch.todayPeak}/10 today` : "One tap, any time it bites",
    },
    {
      href: "/tracker",
      label: "Daily tracker",
      icon: ClipboardList,
      done: !!todayLog,
      meta: todayLog ? `${todayLog.severity}/10 · ${severityWord(todayLog.severity)}` : "About 20 seconds",
    },
    {
      href: "/photos",
      label: "Progress photo",
      icon: Camera,
      done: !!lastPhoto && lastPhoto.slice(0, 10) === today,
      meta: lastPhoto ? `Last photo ${timeAgo(lastPhoto)}` : "Same light, same angle",
    },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  // Insights: the member's own strongest pattern + rotating cohort stats
  // (aggregated nightly, never per-request — see /api/cron/aggregate).
  const personalInsight = computePersonalInsight(logs, triggers, today);
  const cohortStatements = aggregates
    ? rotateStatements(
        buildCohortStatements(aggregates, {
          stage: profile.recoveryStage,
          weeksSinceStart: weeksSinceStart(logs, profile, today),
          condition: profile.condition,
        }),
        personalInsight ? 3 : 4
      )
    : [];

  const risk = forecast ? riskBand(forecast.score) : null;
  const protocolTitles = Object.fromEntries(
    LIBRARY.map((a) => [a.slug, { title: sentenceCase(a.title), category: a.category }])
  );

  return (
    <div>
      {/* One-time onboarding: adapts the whole app to the member's condition. */}
      {user && !profile.condition && (
        <ConditionPickerModal hasLoggedBefore={logs.length > 0 || !!profile.recoveryStage} />
      )}
      {justSubscribed && <WelcomeBanner name={user?.name?.split(" ")[0]} />}

      <PageHeader
        eyebrow={<TodayEyebrow />}
        title={<Greeting name={firstName} />}
        subtitle="However your skin is today, showing up here counts."
        actions={
          <>
            <ButtonLink href="/grade" variant="secondary" icon={ScanEye}>
              Grade a flare
            </ButtonLink>
            <ButtonLink href="/tracker">{todayLog ? "Edit today" : "Log today"}</ButtonLink>
          </>
        }
      />

      {/* Headline numbers. Never a fake figure: a missing value says so. */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Today's severity"
          value={todayLog ? todayLog.severity : "—"}
          unit={todayLog ? "/10" : undefined}
          dotColor={todayLog ? SCORE_COLOR[severityLevel(todayLog.severity)] : undefined}
          meta={todayLog ? severityWord(todayLog.severity) : <Link href="/tracker" className="text-accent-strong hover:underline">Not logged yet</Link>}
        />
        <StatCard
          label="7-day average"
          value={avgThis != null ? avgThis.toFixed(1) : "—"}
          unit={avgThis != null ? "/10" : undefined}
          delta={
            avgDelta != null
              ? { text: `${avgDelta > 0 ? "+" : avgDelta < 0 ? "−" : "±"}${Math.abs(avgDelta).toFixed(1)}`, good: avgDelta < 0 ? true : avgDelta > 0 ? false : null }
              : undefined
          }
          meta={avgDelta != null ? "vs the week before" : avgThis != null ? "Not enough history to compare" : "No logs this week"}
        />
        <StatCard
          label="POEM score"
          value={poem ? poem.score : "—"}
          unit={poem ? `/${POEM_MAX}` : undefined}
          dotColor={poem ? SCORE_COLOR[toneLevel(poem.band.tone)] : undefined}
          meta={poem ? `${poem.band.label} · ${timeAgo(poem.at)}` : <Link href="/poem" className="text-accent-strong hover:underline">Take this week&apos;s POEM</Link>}
        />
        <StatCard
          label="Logging streak"
          value={stats.streak}
          unit={stats.streak === 1 ? "day" : "days"}
          icon={Flame}
          meta={
            stats.streakUsedGrace
              ? "A flare-day pass kept it alive"
              : todayLog
                ? `${stats.daysTracked} days tracked in total`
                : "Log today to keep it going"
          }
        />
      </div>

      {/* Trend (2) + forecast (1) */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SeverityTrend
          points={logs.filter((l) => l.date >= shiftKey(today, 364)).map((l) => ({ date: l.date, severity: l.severity }))}
          today={today}
        />
        <section className="card flex flex-col" aria-labelledby="forecast-title">
          <CardHeader
            title={<span id="forecast-title">Flare forecast</span>}
            subtitle={forecast?.place ?? "Weather and pollen, scored for your skin"}
            action={<CloudSun className="h-4 w-4 text-accent-strong" strokeWidth={1.75} aria-hidden />}
          />
          {forecast && risk ? (
            <div className="flex flex-1 flex-col">
              <div className="flex items-baseline gap-2">
                <span className="stat-num text-[40px]">{forecast.score}</span>
                <span className="font-mono text-meta text-fg-muted">/100 risk</span>
              </div>
              <ScoreBadge level={toneLevel(risk.tone)} label={sentenceCase(risk.label)} className="mt-3 self-start" />
              {forecast.factors.length > 0 && (
                <ul className="mt-4 space-y-2 text-[13.5px] text-fg-secondary">
                  {forecast.factors.slice(0, 3).map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-fg-muted" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/forecast" className="mt-auto pt-4 text-[13.5px] font-medium text-accent-strong hover:underline">
                Full forecast and tips →
              </Link>
            </div>
          ) : (
            <EmptyState
              icon={CloudSun}
              title="No forecast yet today"
              body="Check the local conditions that tend to flare skin."
              action={<ButtonLink href="/forecast" size="sm" variant="secondary">Check forecast</ButtonLink>}
              className="flex-1"
            />
          )}
        </section>
      </div>

      {/* Checklist · triggers · protocol */}
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <section className="card" aria-labelledby="checklist-title">
          <CardHeader
            title={<span id="checklist-title">Today</span>}
            action={
              <span className="font-mono text-meta tabular-nums text-fg-muted">
                {doneCount}/{checklist.length}
              </span>
            }
          />
          <ul className="-mx-2 space-y-1">
            {checklist.map((c) => (
              <li key={c.href}>
                <Link
                  href={c.href}
                  className="flex min-h-12 items-center gap-3 rounded-control px-2 py-2 transition-colors hover:bg-surface-active"
                >
                  <span
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full border",
                      c.done ? "border-primary bg-primary text-white" : "border-line-strong text-transparent"
                    )}
                    aria-hidden
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm font-medium", c.done ? "text-fg-secondary" : "text-fg")}>
                      {c.label}
                      <span className="sr-only">{c.done ? " (done)" : " (to do)"}</span>
                    </span>
                    <span className="block truncate text-meta text-fg-muted">{c.meta}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-fg-faint" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card flex flex-col" aria-labelledby="triggers-title">
          <CardHeader
            title={<span id="triggers-title">Top triggers</span>}
            subtitle="Logged as flaring you · last 90 days"
          />
          {topTriggers.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No flare triggers logged"
              body="Log products, foods and weather to see what flares you."
              action={<ButtonLink href="/triggers" size="sm" variant="secondary">Log a trigger</ButtonLink>}
              className="flex-1 py-6"
            />
          ) : (
            <ul className="space-y-3.5">
              {topTriggers.map(([name, count]) => (
                <li key={name}>
                  <div className="mb-1.5 flex justify-between gap-3 text-[13.5px]">
                    <span className="truncate text-fg">{name}</span>
                    <span className="shrink-0 font-mono tabular-nums text-fg-muted">{count}×</span>
                  </div>
                  <ProgressBar value={count} max={topMax} label={`${name}: ${count} flares`} color={score.poor} />
                </li>
              ))}
              <li>
                <Link href="/triggers" className="text-[13.5px] font-medium text-accent-strong hover:underline">
                  All triggers →
                </Link>
              </li>
            </ul>
          )}
        </section>

        <ContinueProtocol titles={protocolTitles} />
      </div>

      {/* Stage · support · discussion */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="card" aria-labelledby="stage-title">
          <CardHeader title={<span id="stage-title">Where you are</span>} subtitle={profile.condition ? condition.label : undefined} />
          {stage ? (
            <StageSheet
              stages={condition.stages}
              currentStageId={profile.recoveryStage ?? null}
              currentStageName={stage}
            />
          ) : (
            <p className="text-sm text-fg-secondary">
              Mark your stage so the app can meet you there.{" "}
              <Link href="/timeline" className="font-medium text-accent-strong hover:underline">
                Mark it
              </Link>
            </p>
          )}
          <p className="mt-4 text-meta text-fg-muted">
            {stats.daysSinceBadFlare != null
              ? `${stats.daysSinceBadFlare} day${stats.daysSinceBadFlare === 1 ? "" : "s"} since your last bad flare`
              : stats.daysTracked > 0
                ? "No bad flares logged"
                : "Bad-flare-free days are counted once you start logging"}
          </p>
        </section>

        <Link
          href="/support"
          className="card group flex items-center gap-4 transition-colors hover:border-line-strong hover:bg-surface-active"
        >
          <span className="icon-tile shrink-0">
            <LifeBuoy className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="card-title block">Today is bad?</span>
            <span className="mt-0.5 block text-meta text-fg-muted">
              Calming tools, itch coping and the community. No judgement.
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-fg-faint" aria-hidden />
        </Link>

        <section className="card" aria-labelledby="discussion-title">
          <CardHeader
            title={<span id="discussion-title">Latest discussion</span>}
            action={
              <Link href="/community" className="text-[13px] font-medium text-accent-strong hover:underline">
                View all
              </Link>
            }
          />
          {recentPosts.length === 0 ? (
            <p className="text-meta text-fg-muted">
              No posts yet.{" "}
              <Link href="/community" className="text-accent-strong hover:underline">
                Start a discussion
              </Link>
            </p>
          ) : (
            <ul className="-mx-2">
              {recentPosts.slice(0, 3).map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/community/${post.id}`}
                    className="flex min-h-12 items-center justify-between gap-3 rounded-control px-2 py-2 hover:bg-surface-active"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-fg">{post.title}</span>
                      <span className="block truncate text-meta text-fg-muted">
                        {post.category?.name ?? "General"} · {timeAgo(post.createdAt)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 font-mono text-meta tabular-nums text-fg-muted">
                      <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                      {post._count.comments}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <InsightsPanel personal={personalInsight} cohort={cohortStatements} />

      {/* Skin toolkit — validated instruments kept visibly apart. */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {TOOLKIT.map((group) => (
          <section key={group.title} className="card" aria-label={group.title}>
            <CardHeader title={group.title} subtitle={group.blurb} action={<FeatureBadgePill badge={group.badge} />} />
            <ul className="-mx-2">
              {group.tools.map((tool) => (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    className="flex min-h-11 items-center gap-3 rounded-control px-2 py-1.5 hover:bg-surface-active"
                  >
                    <tool.icon className="h-[17px] w-[17px] shrink-0 text-accent-strong" strokeWidth={1.75} aria-hidden />
                    <span className="flex-1 text-sm text-fg">{tool.title}</span>
                    {tool.badge && <FeatureBadgePill badge={tool.badge} />}
                    <ChevronRight className="h-4 w-4 shrink-0 text-fg-faint" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
