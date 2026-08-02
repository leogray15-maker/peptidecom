"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, LifeBuoy, Loader2, Trash2 } from "lucide-react";
import { ITCH_ACTIONS, type ItchPoint, dateKey, itchBand, summariseItch } from "@/lib/tsw";
import { cn } from "@/lib/utils";

export interface ItchEntry extends ItchPoint {
  id: string;
  note: string | null;
  action: string | null;
}

const TONE_TEXT: Record<string, string> = {
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  orange: "text-orange-400",
  rose: "text-rose-400",
};

const TONE_BG: Record<string, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  rose: "bg-rose-500",
};

const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const weekday = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString([], { weekday: "narrow" });

export function ItchClient({ entries }: { entries: ItchEntry[] }) {
  const router = useRouter();
  const [level, setLevel] = useState(5);
  const [action, setAction] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = dateKey();
  const summary = useMemo(() => summariseItch(entries, today), [entries, today]);
  const todays = useMemo(
    () => entries.filter((e) => e.date === today).sort((a, b) => b.at.localeCompare(a.at)),
    [entries, today]
  );
  const band = itchBand(level);
  const weekMax = Math.max(1, ...summary.week.map((d) => d.avg ?? 0));

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/tsw/itch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          at: new Date().toISOString(),
          level,
          note: note.trim() || null,
          action,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Couldn't save that check-in.");
        return;
      }
      setSaved(true);
      setNote("");
      setAction(null);
      router.refresh();
      // Let the tick read for a beat, then arm the button again.
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/tsw/itch?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Couldn't delete that check-in.");
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    }
  }

  return (
    <div className="space-y-4">
      {/* The scale */}
      <div className="card !rounded-3xl">
        <p className="text-center text-sm text-slate-400">How bad is the itch right now?</p>
        <p className="mt-2 text-center text-6xl font-extrabold leading-none tabular-nums text-white">
          {level}
        </p>
        <p className={cn("mt-2 text-center text-lg font-bold", TONE_TEXT[band.tone])}>
          {band.label}
        </p>

        <div className="mt-5 grid grid-cols-6 gap-1.5 sm:grid-cols-11">
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setLevel(n)}
              aria-label={`Itch level ${n}`}
              aria-pressed={level === n}
              className={cn(
                "rounded-xl py-3 text-sm font-semibold tabular-nums transition",
                level === n
                  ? "bg-brand-400 text-lab-bg"
                  : "bg-lab-bg text-slate-400 hover:bg-brand-500/10 hover:text-brand-200"
              )}
            >
              {n}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm font-medium text-slate-300">What helped? (optional)</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ITCH_ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAction((cur) => (cur === a.id ? null : a.id))}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                action === a.id
                  ? "border-brand-500 bg-brand-500/20 text-brand-200"
                  : "border-lab-border text-slate-400 hover:border-brand-700 hover:text-slate-200"
              )}
            >
              {a.label}
            </button>
          ))}
        </div>

        <input
          className="input mt-3"
          placeholder="What were you doing? (optional)"
          value={note}
          maxLength={500}
          onChange={(e) => setNote(e.target.value)}
        />

        <button onClick={save} disabled={saving} className="btn-accent mt-4 w-full">
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : saved ? (
            <Check className="h-5 w-5" />
          ) : null}
          {saved ? "Logged" : "Log this itch"}
        </button>
        {error && <p className="mt-3 text-center text-sm text-rose-400">{error}</p>}
      </div>

      {/* Flare-day support — the one thing a 9/10 itch actually needs. */}
      {level >= 7 && (
        <Link
          href="/support"
          className="card group flex items-center gap-4 !rounded-3xl border-brand-500/30 bg-gradient-to-r from-brand-950/60 to-lab-card transition hover:border-brand-500"
        >
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-500/20 text-brand-300">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-white">That&apos;s a rough one</p>
            <p className="text-sm text-slate-400">
              Cold compress, breathing and distraction tools — all on one screen.
            </p>
          </div>
        </Link>
      )}

      {/* Today */}
      <div className="card !rounded-3xl">
        <div className="flex items-baseline justify-between">
          <p className="font-semibold text-white">Today</p>
          <p className="text-xs text-slate-500">
            {summary.todayCount} check-in{summary.todayCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Average", value: summary.todayAvg },
            { label: "Peak", value: summary.todayPeak },
            { label: "7-day avg", value: summary.weekAvg },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-lab-bg py-3">
              <p className="text-xl font-bold tabular-nums text-white">
                {stat.value ?? "—"}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {todays.length > 0 && (
          <div className="mt-4 divide-y divide-lab-border">
            {todays.map((e) => {
              const b = itchBand(e.level);
              return (
                <div key={e.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-lab-bg",
                      TONE_BG[b.tone]
                    )}
                  >
                    {e.level}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-slate-200">
                      {clock(e.at)}
                      {e.action
                        ? ` · ${ITCH_ACTIONS.find((a) => a.id === e.action)?.label ?? e.action}`
                        : ""}
                    </p>
                    {e.note && <p className="truncate text-xs text-slate-500">{e.note}</p>}
                  </div>
                  <button
                    onClick={() => remove(e.id)}
                    aria-label="Delete check-in"
                    className="shrink-0 text-slate-600 hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Last 7 days */}
      <div className="card !rounded-3xl">
        <p className="font-semibold text-white">Last 7 days</p>
        <div className="mt-4 flex h-28 items-end justify-between gap-2">
          {summary.week.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-full w-full items-end">
                <div
                  className={cn(
                    "w-full rounded-t-lg transition-all",
                    d.avg == null ? "bg-lab-border" : "bg-brand-400"
                  )}
                  style={{ height: `${d.avg == null ? 4 : Math.max(8, (d.avg / weekMax) * 100)}%` }}
                  title={d.avg == null ? "No check-ins" : `${d.avg} average`}
                />
              </div>
              <span className="text-[10px] text-slate-500">{weekday(d.date)}</span>
            </div>
          ))}
        </div>
        {summary.worstHour != null && (
          <p className="mt-4 text-sm text-slate-400">
            Your itch has peaked most often around{" "}
            <span className="font-semibold text-brand-200">
              {summary.worstHour}:00–{(summary.worstHour + 1) % 24}:00
            </span>
            . Worth getting ahead of it — moisturise and cool down before that window.
          </p>
        )}
      </div>

      <p className="text-center text-xs leading-relaxed text-slate-500">
        Check in as often as you like — the point is to see when the itch actually peaks, not to
        keep score. Your end-of-day tracker entry stays the considered record.
      </p>
    </div>
  );
}
