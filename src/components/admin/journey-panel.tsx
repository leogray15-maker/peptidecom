"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Camera,
  CheckCircle2,
  Droplets,
  Flame,
  Gauge,
  Globe,
  Lock,
  Megaphone,
  Moon,
  Sparkles,
  Syringe,
  Trophy,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CustomerJourney } from "@/lib/admin-journey";
import { goalLabel } from "@/lib/tsw";
import { cn, formatDate, timeAgo } from "@/lib/utils";

const TABS = [
  { id: "skin", label: "Skin & tracking", icon: Activity },
  { id: "peptides", label: "Peptides", icon: Syringe },
  { id: "photos", label: "Photos", icon: Camera },
  { id: "progress", label: "Progress & sharing", icon: Trophy },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** The member's own journey, as recorded in the tracker.
 *
 * Deliberately reports rather than exposes: dates, streaks, severity, doses
 * and milestones, but never their private photos. The only pictures here are
 * the ones they chose to share on the community wall. */
export function JourneyPanel({ journey }: { journey: CustomerJourney }) {
  const [tab, setTab] = useState<TabId>("skin");

  if (!journey.hasData) {
    return (
      <div className="card">
        <h2 className="font-semibold text-white">Their journey</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Nothing tracked yet — no logs, photos, doses or journal entries on this account. If
          they joined recently, a nudge to make a first entry is usually what gets the habit
          started.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-white">Their journey</h2>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="badge border border-lab-border text-slate-300">
            {journey.conditionLabel}
          </span>
          {journey.stageLabel && (
            <span className="badge bg-brand-500/15 text-brand-200">{journey.stageLabel}</span>
          )}
          {journey.daysSinceStart != null && (
            <span className="badge border border-lab-border text-slate-400">
              day {journey.daysSinceStart}
            </span>
          )}
          {journey.daysSinceActive != null && (
            <span
              className={cn(
                "badge",
                journey.daysSinceActive <= 3
                  ? "bg-emerald-500/15 text-emerald-300"
                  : journey.daysSinceActive <= 14
                    ? "bg-amber-500/15 text-amber-300"
                    : "bg-rose-500/15 text-rose-300"
              )}
            >
              {journey.daysSinceActive === 0
                ? "active today"
                : `last active ${journey.daysSinceActive}d ago`}
            </span>
          )}
        </div>
      </div>

      {/* Headline numbers — the same shape whichever tab is open. */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric icon={Activity} label="Days tracked" value={journey.daysTracked} />
        <Metric icon={Flame} label="Current streak" value={`${journey.streak}d`} />
        <Metric
          icon={Gauge}
          label="Severity (7d)"
          value={journey.avgSeverity7d ?? "—"}
          tone={
            journey.avgSeverity7d == null
              ? undefined
              : journey.avgSeverity7d >= 7
                ? "bad"
                : journey.avgSeverity7d <= 3
                  ? "good"
                  : undefined
          }
        />
        <Metric icon={Camera} label="Photos" value={journey.photoCount} />
      </div>

      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-lab-border pb-px [scrollbar-width:thin]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition",
              tab === t.id
                ? "border-brand-500 text-brand-200"
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "skin" && <SkinTab journey={journey} />}
        {tab === "peptides" && <PeptidesTab journey={journey} />}
        {tab === "photos" && <PhotosTab journey={journey} />}
        {tab === "progress" && <ProgressTab journey={journey} />}
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  tone?: "good" | "bad";
}) {
  return (
    <div className="rounded-xl border border-lab-border bg-lab-bg p-3">
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <Icon className="h-3.5 w-3.5 text-brand-300" />
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-lg font-bold",
          tone === "bad" ? "text-rose-300" : tone === "good" ? "text-emerald-300" : "text-white"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-500">{children}</p>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-200">{value}</span>
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

function SkinTab({ journey }: { journey: CustomerJourney }) {
  return (
    <div className="space-y-4">
      {journey.severitySeries.length > 1 ? (
        <div>
          <p className="mb-1 text-xs text-slate-500">
            Logged severity, last 90 days — lower is calmer
          </p>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={journey.severitySeries}
                margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="severity-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#7c5cff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#20202b" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: "#20202b" }}
                  interval="preserveStartEnd"
                  tickFormatter={(d: string) => formatDate(d, { year: undefined })}
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={38}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0f0f15",
                    border: "1px solid #20202b",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "#e2e8f0",
                  }}
                  labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
                  formatter={(value: number | string) => [value, "Severity"]}
                />
                <Area
                  type="monotone"
                  dataKey="severity"
                  stroke="#7c5cff"
                  strokeWidth={2}
                  fill="url(#severity-fill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <Empty>Not enough logs yet to draw a trend.</Empty>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            The record
          </h3>
          <Row
            label="Logging window"
            value={
              journey.firstLog
                ? `${formatDate(journey.firstLog)} → ${formatDate(journey.lastLog!)}`
                : "—"
            }
          />
          <Row label="Logged in last 30 days" value={`${journey.activeDays30} days`} />
          <Row label="Severity (30d avg)" value={journey.avgSeverity30d ?? "—"} />
          <Row
            label="Since last bad flare"
            value={
              journey.daysSinceBadFlare == null
                ? "No bad flare logged"
                : `${journey.daysSinceBadFlare} days`
            }
          />
          <Row
            label="Sleep / mood avg"
            value={`${journey.avgSleep ?? "—"} / ${journey.avgMood ?? "—"}`}
          />
          <Row
            label="Stage set"
            value={journey.stageUpdatedAt ? timeAgo(journey.stageUpdatedAt) : "Never"}
          />
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Where it flares
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {journey.topAreas.length === 0 ? (
                <Empty>No areas logged.</Empty>
              ) : (
                journey.topAreas.map((a) => (
                  <span key={a.label} className="badge border border-lab-border text-slate-300">
                    {a.label} · {a.count}
                  </span>
                ))
              )}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              What they report
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {journey.topSymptoms.length === 0 ? (
                <Empty>No symptoms logged.</Empty>
              ) : (
                journey.topSymptoms.map((s) => (
                  <span key={s.label} className="badge border border-lab-border text-slate-300">
                    {s.label} · {s.count}
                  </span>
                ))
              )}
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Itch check-ins
            </h3>
            <Row label="Total" value={journey.itchCheckIns} />
            <Row label="7-day average" value={journey.itchWeekAvg ?? "—"} />
            <Row
              label="Worst hour"
              value={
                journey.itchWorstHour == null
                  ? "Not enough signal"
                  : `${String(journey.itchWorstHour).padStart(2, "0")}:00`
              }
            />
          </div>
        </div>
      </div>

      {journey.triggers.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Their triggers & routines
          </h3>
          <div className="mt-2 space-y-1.5">
            {journey.triggers.map((t) => (
              <div key={`${t.kind}:${t.name}`} className="flex items-center gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate text-slate-200">{t.name}</span>
                <span className="shrink-0 text-xs text-slate-500">{t.kind}</span>
                <span className="shrink-0 text-xs">
                  {t.helped > 0 && <span className="text-emerald-300">↑{t.helped} </span>}
                  {t.flared > 0 && <span className="text-rose-300">↓{t.flared} </span>}
                  {t.neutral > 0 && <span className="text-slate-500">·{t.neutral}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-2 border-t border-lab-border pt-3 sm:grid-cols-2">
        <Row
          label="EASI scores"
          value={`${journey.easiCount}${journey.latestEasi != null ? ` · latest ${journey.latestEasi}` : ""}`}
        />
        <Row
          label="POEM scores"
          value={`${journey.poemCount}${journey.latestPoem != null ? ` · latest ${journey.latestPoem}` : ""}`}
        />
        <Row label="Products scanned" value={journey.scanCount} />
        <Row label="Forecasts saved" value={journey.forecastsSaved} />
      </div>
    </div>
  );
}

function PeptidesTab({ journey }: { journey: CustomerJourney }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric icon={Syringe} label="Doses logged" value={journey.doseCount} />
        <Metric icon={Droplets} label="Compounds" value={journey.peptides.length} />
        <Metric
          icon={CheckCircle2}
          label="Active protocols"
          value={journey.protocols.filter((p) => p.active).length}
        />
      </div>

      {journey.peptides.length === 0 ? (
        <Empty>No doses logged on this account.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-lab-border text-xs uppercase tracking-wider text-slate-500">
                <th className="py-2 pr-3 font-medium">Compound</th>
                <th className="py-2 pr-3 font-medium">Doses</th>
                <th className="py-2 pr-3 font-medium">Total</th>
                <th className="py-2 pr-3 font-medium">Last</th>
                <th className="py-2 font-medium">Running it for</th>
              </tr>
            </thead>
            <tbody>
              {journey.peptides.map((p) => (
                <tr key={p.peptide} className="border-b border-lab-border/60">
                  <td className="py-2 pr-3 font-medium text-white">{p.peptide}</td>
                  <td className="py-2 pr-3 text-slate-300">{p.doses}</td>
                  <td className="py-2 pr-3 text-slate-300">{p.totalMg} mg</td>
                  <td className="whitespace-nowrap py-2 pr-3 text-xs text-slate-400">
                    {formatDate(p.lastDose)}
                  </td>
                  <td className="py-2 text-xs text-slate-400">
                    {p.purposes.map((g) => goalLabel(g) ?? g).join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {journey.protocols.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Dose protocols
          </h3>
          <div className="mt-2 space-y-1.5">
            {journey.protocols.map((p, i) => (
              <div key={`${p.peptide}-${i}`} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate text-slate-200">
                  {p.peptide} · {p.doseMg} mg
                </span>
                <span className="shrink-0 text-xs text-slate-500">{p.schedule}</span>
                <span
                  className={cn(
                    "badge shrink-0",
                    p.active
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "border border-lab-border text-slate-500"
                  )}
                >
                  {p.active ? "active" : "paused"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 border-t border-lab-border pt-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Research journal
        </h3>
        <Row label="Entries" value={journey.journalCount} />
        {journey.latestJournalNote && (
          <div className="rounded-xl border border-lab-border bg-lab-bg p-3">
            <p className="text-xs text-slate-500">
              {formatDate(journey.latestJournalNote.date)} ·{" "}
              {goalLabel(journey.latestJournalNote.goal) ?? journey.latestJournalNote.goal} ·{" "}
              {journey.latestJournalNote.rating}/10
            </p>
            {journey.latestJournalNote.note && (
              <p className="mt-1.5 whitespace-pre-line text-sm text-slate-300">
                {journey.latestJournalNote.note}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PhotosTab({ journey }: { journey: CustomerJourney }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-lab-border bg-lab-bg p-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
        <p className="text-xs leading-relaxed text-slate-400">
          A member&apos;s photo timeline is private to them, so this shows the record — when they
          photographed, which area, and their own severity estimate — and not the pictures. The
          only images below are the ones they chose to share on the community wall.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric icon={Camera} label="Photos taken" value={journey.photoCount} />
        <Metric
          icon={Globe}
          label="Shared publicly"
          value={journey.photos.filter((p) => p.shared).length}
        />
        <Metric
          icon={Moon}
          label="Timeline span"
          value={
            journey.firstPhoto && journey.lastPhoto
              ? `${Math.max(1, Math.round((Date.parse(journey.lastPhoto) - Date.parse(journey.firstPhoto)) / 86_400_000))}d`
              : "—"
          }
        />
      </div>

      {journey.sharedPhotos.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Shared on the community wall
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {journey.sharedPhotos.map((p) => (
              <figure
                key={p.id}
                className="overflow-hidden rounded-lg border border-lab-border"
                title={p.caption ?? undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageData}
                  alt={p.caption ?? `Shared photo from ${p.takenAt}`}
                  className="h-24 w-24 object-cover"
                />
                <figcaption className="bg-lab-bg px-1 py-0.5 text-[9px] text-slate-500">
                  {formatDate(p.takenAt, { year: undefined })}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}

      {journey.photos.length === 0 ? (
        <Empty>No photos on this account.</Empty>
      ) : (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Most recent entries
          </h3>
          <div className="mt-2 space-y-1.5">
            {journey.photos.map((p) => (
              <div key={p.id} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 text-xs text-slate-400">
                  {formatDate(p.takenAt)}
                </span>
                <span className="min-w-0 flex-1 truncate text-slate-300">{p.area ?? "—"}</span>
                {p.score != null && (
                  <span className="shrink-0 text-xs text-slate-500">est. {p.score}</span>
                )}
                {p.shared && (
                  <span className="badge shrink-0 bg-brand-500/15 text-brand-200">
                    <Globe className="h-3 w-3" /> shared
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressTab({ journey }: { journey: CustomerJourney }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Milestones earned
        </h3>
        {journey.milestones.length === 0 ? (
          <Empty>None yet.</Empty>
        ) : (
          <div className="mt-2 space-y-1.5">
            {journey.milestones.map((m) => (
              <div key={m.key} className="flex items-center gap-2 text-sm">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-gold-400" />
                <span className="min-w-0 flex-1 truncate text-slate-200">{m.title}</span>
                <span className="shrink-0 text-xs text-slate-500">
                  {formatDate(m.achievedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Recovery stories
        </h3>
        {journey.stories.length === 0 ? (
          <Empty>They haven&apos;t submitted a story.</Empty>
        ) : (
          <div className="mt-2 space-y-2">
            {journey.stories.map((s) => (
              <div key={s.id} className="rounded-xl border border-lab-border bg-lab-bg p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Trophy className="h-3.5 w-3.5 shrink-0 text-gold-400" />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                    {s.title}
                  </p>
                  {s.featured && (
                    <span className="badge bg-gold-500/15 text-gold-300">
                      <Globe className="h-3 w-3" /> on the site
                    </span>
                  )}
                  {s.marketingConsent ? (
                    <span className="badge bg-emerald-500/15 text-emerald-300">
                      <Megaphone className="h-3 w-3" /> consented
                    </span>
                  ) : (
                    <span className="badge border border-lab-border text-slate-500">wall only</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {s.status}
                  {s.monthsIn != null && ` · ${s.monthsIn} months in`} · {timeAgo(s.createdAt)}
                  {s.photoConsent && " · photos ok"}
                </p>
              </div>
            ))}
          </div>
        )}
        {journey.stories.some((s) => s.marketingConsent && !s.featured) && (
          <p className="mt-2 text-xs text-slate-500">
            A consented story here isn&apos;t on the public site yet —{" "}
            <Link href="/admin/proof" className="text-brand-300 hover:text-brand-200">
              approve it on the proof wall
            </Link>
            .
          </p>
        )}
      </div>

      <div className="space-y-2 border-t border-lab-border pt-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          What they&apos;ve agreed to
        </h3>
        <Row
          label="AI flare grading disclaimer"
          value={
            journey.aiGradingConsentAt ? formatDate(journey.aiGradingConsentAt) : "Not accepted"
          }
        />
        <Row label="Weekly digest" value={journey.digestOptIn ? "Opted in" : "Off"} />
        {journey.consents.map((c) => (
          <Row key={c.key} label={c.key} value={c.on ? "On" : "Off"} />
        ))}
      </div>
    </div>
  );
}
