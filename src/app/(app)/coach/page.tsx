import Link from "next/link";
import { ArrowRight, ClipboardList, Lightbulb, Sparkles } from "lucide-react";
import { FeatureGate } from "@/components/feature-gate";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/auth";
import { type CoachInput, coachActions, coachObservations } from "@/lib/coach";
import { getCondition } from "@/lib/conditions";
import { computePersonalInsight } from "@/lib/insights";
import { safe } from "@/lib/safe-db";
import { type DailyLog, computeStats, dateKey, summariseItch } from "@/lib/tsw";
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

export const metadata = { title: "Coach" };

export default async function CoachPage() {
  const user = await getCurrentUser();
  const uid = user ? tswKey(user) : null;
  const today = dateKey();

  const [logs, triggers, itchLogs, profile, photoDate, poemHistory, forecast] = uid
    ? await Promise.all([
        safe(() => listLogs(uid), [] as DailyLog[]),
        safe(() => listTriggers(uid), [] as TriggerLog[]),
        safe(() => listItchLogs(uid), [] as ItchLog[]),
        safe(() => getProfile(uid), {} as TswProfile),
        safe(() => lastPhotoDate(uid), null as string | null),
        safe(() => getHistory(uid, "poem"), [] as StoredHistoryEntry[]),
        safe(() => getForecast(uid, today), null as SavedForecast | null),
      ])
    : [[], [], [], {} as TswProfile, null, [], null];

  const itch = summariseItch(itchLogs, today);
  const stats = computeStats(logs, today);
  const condition = getCondition(profile.condition);

  const input: CoachInput = {
    today,
    logs,
    triggers: triggers.map((t) => ({ date: t.date, name: t.name, effect: t.effect })),
    itch,
    lastPhotoDate: photoDate,
    lastPoemAt: poemHistory.length ? poemHistory[poemHistory.length - 1].at : null,
    todayForecast: forecast ? { score: forecast.score, band: forecast.band } : null,
    hasForecastLocation: !!profile.location,
  };

  const actions = coachActions(input);
  const observations = coachObservations(input);
  const insight = computePersonalInsight(logs, triggers, today);
  const firstName = user?.name?.split(" ")[0] ?? "there";

  // Nothing logged at all — one clear door rather than an empty dashboard.
  if (logs.length === 0) {
    return (
      <div>
        <PageHeader title="Coach" />
        <FeatureGate
          icon={Sparkles}
          title="Your coach starts with one log"
          description={`Everything here is built from what you record — no generic ${condition.label} advice, just your own patterns read back to you. Log a day and this screen comes alive.`}
          action={{ href: "/tracker", label: "Log today" }}
          secondary={{ href: "/timeline", label: "Or mark where you are in this →" }}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Coach"
        subtitle="Built entirely from your own logs — what's worth doing today, and what your data is saying."
      />

      {/* Today */}
      <section>
        <div className="card !rounded-3xl">
          <p className="text-sm text-slate-400">
            {firstName}, you&apos;ve tracked{" "}
            <span className="font-semibold text-white">{stats.daysTracked} days</span>
            {stats.streak > 0 && (
              <>
                {" "}
                · <span className="font-semibold text-brand-200">{stats.streak}-day streak</span>
              </>
            )}
            {stats.avgSeverity7d != null && (
              <> · 7-day average severity {stats.avgSeverity7d}</>
            )}
            .
          </p>
        </div>
      </section>

      {/* Today's plan */}
      <h2 className="mt-6 text-lg font-semibold text-white">Today&apos;s plan</h2>
      {actions.length === 0 ? (
        <div className="card mt-3 !rounded-3xl text-sm text-slate-400">
          Nothing outstanding — today is logged, your photo and POEM are current and conditions are
          quiet. That is genuinely the whole list.
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {actions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className="card group flex items-start gap-4 !rounded-3xl transition hover:border-brand-500/60"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-500/12 text-brand-300 ring-1 ring-inset ring-brand-500/20">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{action.title}</p>
                <p className="mt-1 text-sm leading-snug text-slate-400">{action.detail}</p>
                <p className="mt-2 text-sm font-medium text-brand-300">{action.cta} →</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 self-center text-slate-600 transition group-hover:text-brand-300" />
            </Link>
          ))}
        </div>
      )}

      {/* What your data says */}
      <h2 className="mt-8 text-lg font-semibold text-white">What your data says</h2>
      {observations.length === 0 && !insight ? (
        <div className="card mt-3 !rounded-3xl text-sm text-slate-400">
          Not enough logged yet to say anything honest. Give it a couple of weeks of days and
          triggers — patterns show up faster than you&apos;d think.
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {insight && (
            <div className="card !rounded-3xl border-brand-500/30">
              <p className="flex items-center gap-2 font-semibold text-white">
                <Lightbulb className="h-4.5 w-4.5 shrink-0 text-brand-300" />
                {insight.headline}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{insight.detail}</p>
            </div>
          )}
          {observations.map((o) => (
            <div key={o.headline} className="card !rounded-3xl">
              <p className="font-semibold text-white">{o.headline}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{o.detail}</p>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs leading-relaxed text-slate-500">
        Everything on this screen is worked out from your own logs on our servers — no third-party
        AI service sees your data. Patterns are prompts for experiments, never diagnoses, and
        nothing here replaces your clinician.
      </p>
    </div>
  );
}
