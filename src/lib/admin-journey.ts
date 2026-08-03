import "server-only";
import { safe } from "@/lib/safe-db";
import { anyStageName, anySymptomLabel, anyZoneLabel, conditionLabel } from "@/lib/conditions";
import { MILESTONE_DEFS, computeStats, dateKey, daysBetween, summariseItch } from "@/lib/tsw";
import type { DailyLog } from "@/lib/tsw";
import { scheduleLabel } from "@/lib/protocol-schedule";
import {
  type ItchLog,
  type JournalEntry,
  type MilestoneRecord,
  type PeptideLog,
  type RecoveryStory,
  type SharedPhoto,
  type TswPhotoMeta,
  type TswProfile,
  getAllHistory,
  getMilestones,
  getProfile,
  listForecasts,
  listItchLogs,
  listJournal,
  listLogs,
  listPeptideLogs,
  listPhotoMeta,
  listProtocols,
  listSharedPhotosByUid,
  listStoriesByUid,
  listTriggers,
  tswKey,
} from "@/lib/tsw-db";
import type { PeptideProtocol } from "@/lib/protocol-schedule";
import type { TriggerLog } from "@/lib/tsw-db";

/** One member's whole journey, assembled for the admin CRM's customer page.
 *
 * A deliberate privacy line runs through this file: the CRM reports on how
 * someone is *tracking* — dates, streaks, severity, doses, milestones — and
 * never renders their private pictures. Photos come back as metadata only
 * (`listPhotoMeta` projects the image data away at the query), and the only
 * pictures included are the ones the member themselves put on the community
 * wall. Everything is read through `safe`, so a member with no tracker data,
 * or an unreachable Firestore, degrades to an empty journey instead of a 500. */

export interface SeverityPoint {
  date: string;
  severity: number;
}

export interface CountedItem {
  label: string;
  count: number;
}

export interface PeptideTotal {
  peptide: string;
  doses: number;
  totalMg: number;
  lastDose: string;
  purposes: string[];
}

export interface TriggerEffect {
  name: string;
  kind: string;
  helped: number;
  flared: number;
  neutral: number;
}

export interface JourneyPhoto {
  id: string;
  takenAt: string;
  area: string | null;
  shared: boolean;
  /** The member's own severity estimate for that photo, when they ran one. */
  score: number | null;
}

export interface JourneyStory {
  id: string;
  title: string;
  monthsIn: number | null;
  createdAt: string;
  status: string;
  featured: boolean;
  marketingConsent: boolean;
  photoConsent: boolean;
}

export interface JourneyMilestone {
  key: string;
  title: string;
  achievedAt: string;
}

export interface CustomerJourney {
  /** False when this member has never used the tracker (or Firestore is
   * unreachable) — the page shows an explanatory card instead of empty stats. */
  hasData: boolean;
  uid: string;

  // ── Where they are ──
  condition: string;
  conditionLabel: string;
  stage: string | null;
  stageLabel: string | null;
  stageUpdatedAt: string | null;
  startDate: string | null;
  daysSinceStart: number | null;
  /** Most recent activity of any kind (log, photo, dose, journal, itch). */
  lastActiveAt: string | null;
  daysSinceActive: number | null;

  // ── Skin tracking ──
  daysTracked: number;
  streak: number;
  activeDays30: number;
  avgSeverity7d: number | null;
  avgSeverity30d: number | null;
  daysSinceBadFlare: number | null;
  firstLog: string | null;
  lastLog: string | null;
  /** Last 90 days of logged severity, oldest first. */
  severitySeries: SeverityPoint[];
  topAreas: CountedItem[];
  topSymptoms: CountedItem[];
  avgSleep: number | null;
  avgMood: number | null;

  // ── Itch check-ins ──
  itchCheckIns: number;
  itchWeekAvg: number | null;
  itchWorstHour: number | null;

  // ── Photos (metadata; see the privacy note above) ──
  photoCount: number;
  firstPhoto: string | null;
  lastPhoto: string | null;
  photos: JourneyPhoto[];
  /** The pictures this member chose to share on the community wall — the only
   * ones an admin sees. */
  sharedPhotos: { id: string; takenAt: string; caption: string | null; imageData: string }[];

  // ── Peptides ──
  doseCount: number;
  peptides: PeptideTotal[];
  protocols: { peptide: string; doseMg: number; schedule: string; active: boolean }[];

  // ── Journal ──
  journalCount: number;
  journalSeries: { date: string; rating: number }[];
  latestJournalNote: { date: string; goal: string; rating: number; note: string | null } | null;

  // ── Triggers ──
  triggers: TriggerEffect[];

  // ── Tools ──
  easiCount: number;
  poemCount: number;
  scanCount: number;
  latestEasi: number | null;
  latestPoem: number | null;
  forecastsSaved: number;

  // ── Progress & sharing ──
  milestones: JourneyMilestone[];
  stories: JourneyStory[];

  // ── What they've agreed to ──
  aiGradingConsentAt: string | null;
  digestOptIn: boolean;
  consents: { key: string; on: boolean }[];
}

function topCounts(
  values: string[],
  label: (id: string) => string,
  limit = 5
): CountedItem[] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, count]) => ({ label: label(id), count }));
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((s, x) => s + x, 0) / values.length) * 10) / 10;
}

/** The latest date any of these lists touches, as YYYY-MM-DD. */
function latestDate(...dates: (string | null | undefined)[]): string | null {
  const keys = dates.filter((d): d is string => !!d).map((d) => d.slice(0, 10)).sort();
  return keys.length > 0 ? keys[keys.length - 1] : null;
}

export async function getCustomerJourney(user: {
  id: string;
  firebaseUid?: string | null;
}): Promise<CustomerJourney> {
  const uid = tswKey(user);
  const today = dateKey();

  const [
    profile,
    logs,
    photoMeta,
    sharedPhotos,
    peptideLogs,
    protocols,
    journal,
    triggers,
    itchLogs,
    milestoneRecords,
    stories,
    history,
    forecasts,
  ] = await Promise.all([
    safe(() => getProfile(uid), {} as TswProfile),
    safe(() => listLogs(uid), [] as DailyLog[]),
    safe(() => listPhotoMeta(uid), [] as TswPhotoMeta[]),
    safe(() => listSharedPhotosByUid(uid), [] as SharedPhoto[]),
    safe(() => listPeptideLogs(uid), [] as PeptideLog[]),
    safe(() => listProtocols(uid), [] as PeptideProtocol[]),
    safe(() => listJournal(uid), [] as JournalEntry[]),
    safe(() => listTriggers(uid), [] as TriggerLog[]),
    safe(() => listItchLogs(uid), [] as ItchLog[]),
    safe(() => getMilestones(uid), [] as MilestoneRecord[]),
    safe(() => listStoriesByUid(uid), [] as RecoveryStory[]),
    safe(() => getAllHistory(uid), {} as Record<string, { at: string; score: number }[]>),
    safe(() => listForecasts(uid, 30), []),
  ]);

  const condition = profile.condition ?? "tsw";
  const stats = computeStats(logs, today);

  const recent30 = logs.filter((l) => daysBetween(l.date, today) < 30);
  const severitySeries = logs
    .filter((l) => daysBetween(l.date, today) < 90)
    .map((l) => ({ date: l.date, severity: l.severity }));

  const doseTotals = new Map<string, PeptideTotal>();
  for (const log of peptideLogs) {
    const key = log.peptide.trim();
    const entry = doseTotals.get(key) ?? {
      peptide: key,
      doses: 0,
      totalMg: 0,
      lastDose: log.date,
      purposes: [],
    };
    entry.doses += 1;
    entry.totalMg += log.doseMg;
    if (log.date > entry.lastDose) entry.lastDose = log.date;
    if (log.purpose && !entry.purposes.includes(log.purpose)) entry.purposes.push(log.purpose);
    doseTotals.set(key, entry);
  }

  const triggerTotals = new Map<string, TriggerEffect>();
  for (const t of triggers) {
    const key = `${t.kind}:${t.name.toLowerCase()}`;
    const entry = triggerTotals.get(key) ?? {
      name: t.name,
      kind: t.kind,
      helped: 0,
      flared: 0,
      neutral: 0,
    };
    if (t.effect > 0) entry.helped += 1;
    else if (t.effect < 0) entry.flared += 1;
    else entry.neutral += 1;
    triggerTotals.set(key, entry);
  }

  const itch = summariseItch(
    itchLogs.map((l) => ({ date: l.date, at: l.at, level: l.level })),
    today
  );

  const easi = history.easi ?? [];
  const poem = history.poem ?? [];
  const lastActiveAt = latestDate(
    logs[logs.length - 1]?.date,
    photoMeta[photoMeta.length - 1]?.takenAt,
    peptideLogs[0]?.date,
    journal[0]?.date,
    itchLogs[0]?.date
  );

  const hasData =
    logs.length > 0 ||
    photoMeta.length > 0 ||
    peptideLogs.length > 0 ||
    journal.length > 0 ||
    itchLogs.length > 0 ||
    stories.length > 0 ||
    !!profile.recoveryStage;

  return {
    hasData,
    uid,

    condition,
    conditionLabel: conditionLabel(condition),
    stage: profile.recoveryStage ?? null,
    stageLabel: anyStageName(profile.recoveryStage, condition),
    stageUpdatedAt: profile.stageUpdatedAt ?? null,
    startDate: profile.tswStartDate ?? null,
    daysSinceStart: profile.tswStartDate ? daysBetween(profile.tswStartDate, today) : null,
    lastActiveAt,
    daysSinceActive: lastActiveAt ? daysBetween(lastActiveAt, today) : null,

    daysTracked: stats.daysTracked,
    streak: stats.streak,
    activeDays30: recent30.length,
    avgSeverity7d: stats.avgSeverity7d,
    avgSeverity30d: mean(recent30.map((l) => l.severity)),
    daysSinceBadFlare: stats.daysSinceBadFlare,
    firstLog: logs[0]?.date ?? null,
    lastLog: logs[logs.length - 1]?.date ?? null,
    severitySeries,
    topAreas: topCounts(logs.flatMap((l) => l.areas), anyZoneLabel),
    topSymptoms: topCounts(logs.flatMap((l) => l.symptoms), anySymptomLabel),
    avgSleep: mean(logs.map((l) => l.sleep).filter((x): x is number => x != null)),
    avgMood: mean(logs.map((l) => l.mood).filter((x): x is number => x != null)),

    itchCheckIns: itchLogs.length,
    itchWeekAvg: itch.weekAvg,
    itchWorstHour: itch.worstHour,

    photoCount: photoMeta.length,
    firstPhoto: photoMeta[0]?.takenAt ?? null,
    lastPhoto: photoMeta[photoMeta.length - 1]?.takenAt ?? null,
    photos: photoMeta
      .slice(-24)
      .reverse()
      .map((p) => ({
        id: p.id,
        takenAt: p.takenAt,
        area: p.area ?? null,
        shared: p.shared === true,
        score: p.estimate?.score ?? null,
      })),
    sharedPhotos: sharedPhotos.map((p) => ({
      id: p.id,
      takenAt: p.takenAt,
      caption: p.caption,
      imageData: p.imageData,
    })),

    doseCount: peptideLogs.length,
    peptides: [...doseTotals.values()]
      .map((p) => ({ ...p, totalMg: Math.round(p.totalMg * 100) / 100 }))
      .sort((a, b) => b.doses - a.doses),
    protocols: protocols.map((p) => ({
      peptide: p.peptide,
      doseMg: p.doseMg,
      schedule: scheduleLabel(p.schedule),
      active: p.active,
    })),

    journalCount: journal.length,
    journalSeries: [...journal]
      .reverse()
      .slice(-60)
      .map((e) => ({ date: e.date, rating: e.rating })),
    latestJournalNote: journal[0]
      ? {
          date: journal[0].date,
          goal: journal[0].goal,
          rating: journal[0].rating,
          note: journal[0].note,
        }
      : null,

    triggers: [...triggerTotals.values()]
      .sort((a, b) => b.flared + b.helped - (a.flared + a.helped))
      .slice(0, 8),

    easiCount: easi.length,
    poemCount: poem.length,
    scanCount: (history.scans ?? []).length,
    latestEasi: easi[easi.length - 1]?.score ?? null,
    latestPoem: poem[poem.length - 1]?.score ?? null,
    forecastsSaved: forecasts.length,

    milestones: milestoneRecords
      .filter((m) => MILESTONE_DEFS[m.key])
      .map((m) => ({
        key: m.key,
        title: MILESTONE_DEFS[m.key].title,
        achievedAt: m.achievedAt,
      }))
      .sort((a, b) => a.achievedAt.localeCompare(b.achievedAt)),

    stories: stories.map((s) => ({
      id: s.id,
      title: s.title,
      monthsIn: s.monthsIn,
      createdAt: s.createdAt,
      status: s.status ?? "new",
      featured: s.featured === true,
      marketingConsent: s.marketingConsent === true,
      photoConsent: s.photoConsent === true,
    })),

    aiGradingConsentAt: profile.aiGradingConsent?.acceptedAt ?? null,
    digestOptIn: profile.digestPrefs?.enabled === true,
    consents: Object.entries(profile.consents ?? {}).map(([key, on]) => ({
      key,
      on: on === true,
    })),
  };
}
