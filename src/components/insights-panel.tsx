"use client";

import { useState } from "react";
import { FlaskConical, Lock, Sparkles, Users, X } from "lucide-react";
import {
  type CohortStatement,
  type PersonalInsight,
  MIN_PERSONAL_SAMPLE,
  PATTERN_NOT_PROOF,
} from "@/lib/insights";
import { trackEvent } from "@/lib/analytics";

/** What "never leaves your account" actually means, spelled out. Promoted from
 * footer small-print to a tappable lock on the card itself — the claim is only
 * worth making if members can see the reasoning behind it. */
function PrivacyModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-lab-border bg-lab-card p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 text-brand-300">
          <Lock className="h-5 w-5" />
          <h2 className="text-lg font-semibold text-white">This card never leaves your account</h2>
        </div>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
          <li className="flex gap-3">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
            <span>
              It is computed from your own logs, for you alone. Nobody else — not another member,
              not an advertiser, not a third-party AI service — is shown it.
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
            <span>
              Your notes, dates, photos and trigger names are never included in the community
              statistics below. Those are built from anonymous per-member summaries with at least
              20 people behind every number.
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
            <span>
              You can export or delete your tracking data at any time from Settings, and deleting
              it removes it from future community statistics too.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

/** The raw statistics behind the plain-language bucket — one tap away, never
 * in the headline. */
function NumbersDetail({ personal }: { personal: PersonalInsight }) {
  const rows: [string, string][] = [
    ["Correlation (r)", personal.r.toFixed(2)],
    ["Strength", personal.bucket],
    ["Sample size", `${personal.n} day-pairs`],
    ["Window", `last ${personal.windowDays} days`],
    ["Minimum to show this card", `${MIN_PERSONAL_SAMPLE} day-pairs`],
  ];
  return (
    <div className="mt-3 rounded-2xl border border-lab-border bg-lab-bg/60 p-4">
      <dl className="space-y-1.5">
        {rows.map(([term, value]) => (
          <div key={term} className="flex items-start justify-between gap-4 text-xs">
            <dt className="shrink-0 text-slate-500">{term}</dt>
            <dd className="text-right font-medium tabular-nums text-slate-300">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        <span className="font-medium text-slate-400">Method:</span> {personal.method}. Only
        consecutive logged days count, so a gap in your logs shrinks the sample rather than
        inventing a value for the missing day.
      </p>
    </div>
  );
}

/** Dashboard insights: one personal card (from the member's own data) plus a
 * few rotating cohort stats. Renders nothing at all when there's nothing
 * worth saying — an empty shell would just be noise. */
export function InsightsPanel({
  personal,
  cohort,
}: {
  personal: PersonalInsight | null;
  cohort: CohortStatement[];
}) {
  const [showNumbers, setShowNumbers] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  if (!personal && cohort.length === 0) return null;

  return (
    <div className="mt-8">
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4.5 w-4.5 text-brand-300" />
        <h2 className="text-lg font-semibold text-white">From the lab data</h2>
      </div>
      <div className="mt-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {personal && (
          <div className="card border-brand-500/40 bg-gradient-to-br from-brand-950/40 to-lab-card">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-brand-300">
                <Sparkles className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-widest">Your data</p>
              </div>
              <button
                onClick={() => {
                  setShowPrivacy(true);
                  trackEvent("insight_privacy_view");
                }}
                className="flex shrink-0 items-center gap-1 rounded-full border border-lab-border px-2 py-0.5 text-[11px] font-medium text-slate-400 transition hover:border-brand-600 hover:text-brand-200"
                title="What happens to this data"
              >
                <Lock className="h-3 w-3" /> Private to you
              </button>
            </div>
            <p
              className="mt-2 cursor-pointer font-semibold text-white"
              onClick={() => trackEvent("insight_card_tap")}
            >
              {personal.headline}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{personal.detail}</p>
            <p className="mt-2 text-xs font-medium text-slate-500">{PATTERN_NOT_PROOF}</p>
            <button
              onClick={() => {
                setShowNumbers((v) => !v);
                if (!showNumbers) trackEvent("insight_numbers_view");
              }}
              className="mt-3 text-xs font-medium text-brand-300 hover:text-brand-200"
            >
              {showNumbers ? "Hide the numbers" : "See the numbers →"}
            </button>
            {showNumbers && <NumbersDetail personal={personal} />}
          </div>
        )}
        {cohort.map((s) => (
          <div key={s.id} className="card">
            <div className="flex items-center gap-2 text-slate-500">
              <Users className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-widest">The community</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{s.text}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Community stats are anonymised averages across members ({">"}= 20 people behind every
        number) — patterns, not predictions.
      </p>
    </div>
  );
}
