"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { RESEARCH_GOALS, dateKey, goalEmoji, goalLabel } from "@/lib/tsw";
import { cn, formatDate } from "@/lib/utils";

export interface JournalItem {
  id: string;
  date: string;
  goal: string;
  rating: number;
  weightKg: number | null;
  note: string | null;
}

const tooltipStyle = {
  background: "#0f0f15",
  border: "1px solid #20202b",
  borderRadius: 12,
  color: "#e2e8f0",
} as const;

export function JournalClient({ initialEntries }: { initialEntries: JournalItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(initialEntries.length === 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [form, setForm] = useState({
    date: dateKey(),
    goal: "general",
    rating: 5,
    weightKg: "",
    note: "",
  });

  const goalsInUse = useMemo(() => {
    const used = new Set(initialEntries.map((e) => e.goal));
    return RESEARCH_GOALS.filter((g) => used.has(g.id));
  }, [initialEntries]);

  const filtered = useMemo(
    () => (filter === "all" ? initialEntries : initialEntries.filter((e) => e.goal === filter)),
    [initialEntries, filter]
  );

  // Rating trend for the current filter (single goal reads best; "all" mixes).
  const ratingData = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((e) => ({
          date: new Date(e.date + "T12:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          rating: e.rating,
          weight: e.weightKg ?? undefined,
        })),
    [filtered]
  );

  const hasWeight = ratingData.some((d) => d.weight != null);

  // Headline weight numbers: latest reading and total change since the first
  // one — the "170.4 · −20.3" glance the chart alone doesn't give.
  const weightStats = useMemo(() => {
    const weighed = [...initialEntries]
      .filter((e) => e.weightKg != null)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (weighed.length === 0) return null;
    const first = weighed[0];
    const latest = weighed[weighed.length - 1];
    return {
      latest: latest.weightKg as number,
      latestDate: latest.date,
      change: Math.round(((latest.weightKg as number) - (first.weightKg as number)) * 10) / 10,
      sinceDate: first.date,
      readings: weighed.length,
    };
  }, [initialEntries]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date,
        goal: form.goal,
        rating: form.rating,
        weightKg: form.weightKg.trim() === "" ? null : parseFloat(form.weightKg),
        note: form.note.trim() || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't save.");
      return;
    }
    setForm({ ...form, note: "", weightKg: "" });
    setOpen(false);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this journal entry? This can't be undone.")) return;
    await fetch(`/api/journal?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => setOpen((v) => !v)} className="btn-primary">
          <Plus className="h-4 w-4" /> New entry
        </button>
      </div>

      {open && (
        <form onSubmit={save} className="card space-y-5">
          <div>
            <label className="label">What are you tracking toward?</label>
            <div className="flex flex-wrap gap-2">
              {RESEARCH_GOALS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setForm({ ...form, goal: g.id })}
                  className={cn(
                    "rounded-xl border px-3.5 py-2 text-sm font-medium transition",
                    form.goal === g.id
                      ? "border-brand-500 bg-brand-500/20 text-brand-200"
                      : "border-lab-border text-slate-400 hover:border-brand-700 hover:text-slate-200"
                  )}
                >
                  {g.emoji} {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label className="label !mb-0">How is it going toward this goal?</label>
              <span className="rounded-full bg-brand-500/20 px-2.5 py-0.5 text-sm font-bold text-brand-200">
                {form.rating}/10
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value, 10) })}
              className="mt-3 w-full accent-brand-500"
            />
            <div className="mt-1 flex justify-between text-[11px] text-slate-500">
              <span>Going backwards</span>
              <span>No change</span>
              <span>Big progress</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} max={dateKey()} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="label">Weight (kg, optional)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                className="input"
                placeholder="Only if relevant to you"
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">What did you notice?</label>
            <textarea
              className="input min-h-20"
              placeholder="e.g. Skin texture smoother on my forearms · lifted heavier than last week · sharper focus in the mornings…"
              value={form.note}
              maxLength={2000}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save entry
            </button>
          </div>
        </form>
      )}

      {/* Goal filter */}
      {goalsInUse.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "badge border transition",
              filter === "all"
                ? "border-brand-500 bg-brand-500/20 text-brand-200"
                : "border-lab-border text-slate-400 hover:text-slate-200"
            )}
          >
            All goals
          </button>
          {goalsInUse.map((g) => (
            <button
              key={g.id}
              onClick={() => setFilter(g.id)}
              className={cn(
                "badge border transition",
                filter === g.id
                  ? "border-brand-500 bg-brand-500/20 text-brand-200"
                  : "border-lab-border text-slate-400 hover:text-slate-200"
              )}
            >
              {g.emoji} {g.label}
            </button>
          ))}
        </div>
      )}

      {/* Trend */}
      <div className="card">
        <p className="font-semibold text-white">
          Progress trend{filter !== "all" ? ` — ${goalLabel(filter)}` : ""}
        </p>
        <p className="mt-0.5 text-sm text-slate-500">
          Your own 1–10 rating over time{filter === "all" && goalsInUse.length > 1 ? " (pick a goal above for a cleaner read)" : ""}.
        </p>
        {ratingData.length > 1 ? (
          <div className="mt-4 h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ratingData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#20202b" />
                <XAxis dataKey="date" stroke="#6b6b7b" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 10]} stroke="#6b6b7b" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                {/* Show dots on sparse data — a 1-2 point line is invisible without them */}
                <Line type="monotone" dataKey="rating" name="Progress (1–10)" stroke="#7c5cff" strokeWidth={2} dot={ratingData.length < 5 ? { r: 3, fill: "#7c5cff" } : false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">Two or more entries draw the line.</p>
        )}
      </div>

      {/* Weight small-multiple, only when logged */}
      {hasWeight && (
        <div className="card">
          <p className="font-semibold text-white">Weight</p>
          {weightStats && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-md">
              <div className="rounded-xl border border-lab-border bg-lab-bg p-3">
                <p className="text-xs text-slate-500">Latest</p>
                <p className="mt-0.5 text-2xl font-bold text-white">
                  {weightStats.latest}
                  <span className="text-sm font-normal text-slate-500"> kg</span>
                </p>
                <p className="text-[11px] text-slate-500">{formatDate(weightStats.latestDate)}</p>
              </div>
              <div className="rounded-xl border border-lab-border bg-lab-bg p-3">
                <p className="text-xs text-slate-500">Change</p>
                <p
                  className={cn(
                    "mt-0.5 text-2xl font-bold",
                    weightStats.change < 0
                      ? "text-emerald-300"
                      : weightStats.change > 0
                        ? "text-amber-300"
                        : "text-white"
                  )}
                >
                  {weightStats.change > 0 ? "+" : ""}
                  {weightStats.change}
                  <span className="text-sm font-normal text-slate-500"> kg</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  since {formatDate(weightStats.sinceDate)} · {weightStats.readings} readings
                </p>
              </div>
            </div>
          )}
          <div className="mt-4 h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ratingData} margin={{ top: 5, right: 10, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#20202b" />
                <XAxis dataKey="date" stroke="#6b6b7b" fontSize={11} tickLine={false} />
                <YAxis domain={["auto", "auto"]} stroke="#6b6b7b" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#0d9488" strokeWidth={2} dot={ratingData.filter((d) => d.weight != null).length < 5 ? { r: 3, fill: "#0d9488" } : false} activeDot={{ r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* History */}
      <div className="card">
        <p className="mb-4 font-semibold text-white">Entries</p>
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500">
            No entries yet. Whatever you&apos;re researching for — skin, muscle, focus, sleep —
            rate how it&apos;s going and jot what you noticed. The trend takes care of itself.
          </p>
        ) : (
          <div className="divide-y divide-lab-border">
            {filtered.map((e) => (
              <div key={e.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-white">{formatDate(e.date)}</p>
                    <span className="badge bg-brand-900/60 text-brand-200">
                      {goalEmoji(e.goal)} {goalLabel(e.goal)}
                    </span>
                    <span className="badge border border-lab-border text-slate-300">{e.rating}/10</span>
                    {e.weightKg != null && (
                      <span className="text-xs text-slate-500">{e.weightKg} kg</span>
                    )}
                  </div>
                  {e.note && <p className="mt-1 text-xs text-slate-500">{e.note}</p>}
                </div>
                <button
                  onClick={() => remove(e.id)}
                  className="shrink-0 text-slate-600 hover:text-rose-400"
                  aria-label="Delete entry"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
