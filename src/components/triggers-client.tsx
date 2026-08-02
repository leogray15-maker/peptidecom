"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bandage,
  Brain,
  BriefcaseMedical,
  Check,
  Cigarette,
  Droplets,
  Dumbbell,
  Loader2,
  Moon,
  Pill,
  Plus,
  Save,
  Shirt,
  ShowerHead,
  Snowflake,
  Sparkles,
  Sun,
  Trash2,
  Utensils,
  Waves,
  Wind,
  Wine,
} from "lucide-react";
import { TRIGGER_EFFECTS, TRIGGER_KINDS, dateKey } from "@/lib/tsw";
import { cn, formatDate } from "@/lib/utils";

export interface TriggerItem {
  id: string;
  date: string;
  kind: string;
  name: string;
  effect: number;
  note: string | null;
}

export interface ChecklistItem {
  name: string;
  kind: string;
  icon: string;
}

/** Icon names come from the data in lib/tsw.ts as strings — this is where they
 * become components. Anything unmapped falls back to a neutral mark. */
const ICONS: Record<string, React.ElementType> = {
  Bandage,
  Brain,
  BriefcaseMedical,
  Cigarette,
  Droplets,
  Dumbbell,
  Moon,
  Pill,
  Shirt,
  ShowerHead,
  Snowflake,
  Sun,
  Utensils,
  Waves,
  Wind,
  Wine,
};

const kindLabel = (id: string) => TRIGGER_KINDS.find((k) => k.id === id)?.label ?? id;

function effectBadge(effect: number) {
  if (effect === 1) return { label: "helped", cls: "bg-emerald-500/15 text-emerald-300" };
  if (effect === -1) return { label: "flared", cls: "bg-rose-500/15 text-rose-300" };
  return { label: "logged", cls: "bg-slate-500/15 text-slate-400" };
}

export function TriggersClient({
  initialEntries,
  checklist,
}: {
  initialEntries: TriggerItem[];
  checklist: ChecklistItem[];
}) {
  const router = useRouter();
  const today = dateKey();

  // ── Today's checklist ────────────────────────────────────────────────────
  const loggedToday = useMemo(
    () =>
      new Set(
        initialEntries.filter((e) => e.date === today).map((e) => e.name.trim().toLowerCase())
      ),
    [initialEntries, today]
  );
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [savingDay, setSavingDay] = useState(false);
  const [dayError, setDayError] = useState<string | null>(null);

  // ── Detailed entry (name + effect + note) ────────────────────────────────
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [effectFilter, setEffectFilter] = useState<number | "all">("all");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [form, setForm] = useState({
    date: today,
    kind: "product",
    name: "",
    effect: 0,
    note: "",
  });

  const visibleEntries = useMemo(
    () =>
      initialEntries.filter(
        (e) =>
          (effectFilter === "all" || e.effect === effectFilter) &&
          (kindFilter === "all" || e.kind === kindFilter)
      ),
    [initialEntries, effectFilter, kindFilter]
  );

  /** How often each trigger has been checked — the bar chart. */
  const mostChecked = useMemo(() => {
    const counts = new Map<string, { name: string; n: number }>();
    for (const e of initialEntries) {
      const key = e.name.trim().toLowerCase();
      const cur = counts.get(key) ?? { name: e.name, n: 0 };
      cur.n++;
      counts.set(key, cur);
    }
    return [...counts.values()].sort((a, b) => b.n - a.n).slice(0, 6);
  }, [initialEntries]);

  /** Entries grouped by day, newest first — the "recent days" list. */
  const recentDays = useMemo(() => {
    const byDate = new Map<string, string[]>();
    for (const e of [...initialEntries].sort((a, b) => b.date.localeCompare(a.date))) {
      byDate.set(e.date, [...(byDate.get(e.date) ?? []), e.name]);
    }
    return [...byDate.entries()].slice(0, 7);
  }, [initialEntries]);

  /** What the member's own logs suggest: anything logged 2+ times with an
   * effect recorded. Unchanged from before — it's the payoff for logging. */
  const patterns = useMemo(() => {
    const byName = new Map<
      string,
      { name: string; kind: string; helped: number; flared: number; total: number }
    >();
    for (const e of initialEntries) {
      const key = e.name.trim().toLowerCase();
      const cur = byName.get(key) ?? { name: e.name, kind: e.kind, helped: 0, flared: 0, total: 0 };
      cur.total++;
      if (e.effect === 1) cur.helped++;
      if (e.effect === -1) cur.flared++;
      byName.set(key, cur);
    }
    return [...byName.values()]
      .filter((p) => p.total >= 2 && (p.helped > 0 || p.flared > 0))
      .sort((x, y) => y.total - x.total)
      .slice(0, 8);
  }, [initialEntries]);

  function togglePick(name: string) {
    setPicked((cur) => {
      const next = new Set(cur);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  /** Save every ticked trigger for today in one go. */
  async function saveDay() {
    if (picked.size === 0) return;
    setSavingDay(true);
    setDayError(null);
    try {
      const res = await fetch("/api/tsw/triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: checklist
            .filter((c) => picked.has(c.name))
            .map((item) => ({
              date: today,
              kind: item.kind,
              name: item.name,
              // Presence, not a verdict: the checklist records that it happened.
              // Whether it helped or flared is a judgement for the detailed form.
              effect: 0,
              note: null,
            })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDayError(data.error ?? "Those didn't save — check your connection and try again.");
        return;
      }
      setPicked(new Set());
      router.refresh();
    } catch {
      setDayError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setSavingDay(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/tsw/triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, name: form.name.trim(), note: form.note.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't save.");
        return;
      }
      setForm({ ...form, name: "", effect: 0, note: "" });
      setOpen(false);
      router.refresh();
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this entry? This can't be undone.")) return;
    setError(null);
    try {
      const res = await fetch(`/api/tsw/triggers?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't delete the entry.");
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    }
  }

  const maxCount = Math.max(1, ...mostChecked.map((m) => m.n));

  return (
    <div className="space-y-5">
      {/* Today's checklist */}
      <div className="space-y-2">
        {checklist.map((item) => {
          const Icon = ICONS[item.icon] ?? Sparkles;
          const already = loggedToday.has(item.name.trim().toLowerCase());
          const on = picked.has(item.name);
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => !already && togglePick(item.name)}
              disabled={already}
              aria-pressed={on || already}
              className={cn(
                on || already ? "tap-row-on" : "tap-row-idle",
                already && "opacity-60"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  on || already ? "text-brand-300" : "text-brand-400/70"
                )}
              />
              <span className="min-w-0 flex-1 truncate text-base font-medium">{item.name}</span>
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full border",
                  on || already
                    ? "border-brand-400 bg-brand-400 text-lab-bg"
                    : "border-slate-600"
                )}
              >
                {(on || already) && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={saveDay}
        disabled={picked.size === 0 || savingDay}
        className="btn-accent w-full"
      >
        {savingDay ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
        {picked.size === 0
          ? "Save today's triggers"
          : `Save ${picked.size} trigger${picked.size === 1 ? "" : "s"}`}
      </button>
      {dayError && <p className="text-center text-sm text-rose-400">{dayError}</p>}

      {/* Anything not on the list */}
      <div>
        <button onClick={() => setOpen((v) => !v)} className="btn-accent-ghost w-full">
          <Plus className="h-4 w-4" /> Log something else
        </button>
      </div>

      {open && (
        <form onSubmit={save} className="card grid gap-4 !rounded-3xl sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">What was it?</label>
            <input
              className="input"
              placeholder="e.g. New moisturiser, dairy, hot shower…"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              maxLength={120}
            />
          </div>
          <div>
            <label className="label">Type</label>
            <select
              className="input"
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value })}
            >
              {TRIGGER_KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={form.date}
              max={today}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">How did your skin respond?</label>
            <div className="flex gap-2">
              {TRIGGER_EFFECTS.map((ef) => (
                <button
                  key={ef.value}
                  type="button"
                  onClick={() => setForm({ ...form, effect: ef.value })}
                  className={cn(
                    "flex-1 rounded-xl border px-2 py-2.5 text-xs font-medium transition",
                    form.effect === ef.value
                      ? "border-brand-500 bg-brand-500/20 text-brand-200"
                      : "border-lab-border text-slate-400 hover:text-slate-200"
                  )}
                >
                  {ef.label}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Note (optional)</label>
            <input
              className="input"
              value={form.note}
              maxLength={1000}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
          {error && <p className="text-sm text-rose-400 sm:col-span-2">{error}</p>}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </button>
          </div>
        </form>
      )}

      {!open && error && <p className="text-sm text-rose-400">{error}</p>}

      {/* Most-checked */}
      {mostChecked.length > 0 && (
        <div className="card !rounded-3xl">
          <p className="font-semibold text-white">Most-checked triggers</p>
          <div className="mt-4 space-y-2.5">
            {mostChecked.map((m) => (
              <div key={m.name} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-sm text-slate-300">{m.name}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-lab-bg">
                  <div
                    className="h-full rounded-full bg-brand-400"
                    style={{ width: `${(m.n / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-sm font-bold tabular-nums text-white">
                  {m.n}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent days */}
      {recentDays.length > 0 && (
        <div className="card !rounded-3xl">
          <p className="font-semibold text-white">Recent days</p>
          <div className="mt-3 space-y-2.5">
            {recentDays.map(([date, names]) => (
              <div key={date} className="flex gap-3 text-sm">
                <span className="w-24 shrink-0 font-medium text-brand-300">
                  {formatDate(date)}
                </span>
                <span className="min-w-0 flex-1 text-slate-400">{names.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patterns */}
      {patterns.length > 0 && (
        <div className="card !rounded-3xl">
          <p className="font-semibold text-white">Your patterns</p>
          <p className="mt-1 text-sm text-slate-500">
            What your own logs suggest — patterns, not verdicts. One-off reactions happen.
          </p>
          <div className="mt-4 space-y-2">
            {patterns.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between rounded-xl bg-lab-bg px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-medium text-slate-200">{p.name}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {kindLabel(p.kind)} · logged {p.total}×
                  </span>
                </div>
                <div className="flex gap-2 text-xs">
                  {p.helped > 0 && (
                    <span className="badge bg-emerald-500/15 text-emerald-300">
                      helped {p.helped}×
                    </span>
                  )}
                  {p.flared > 0 && (
                    <span className="badge bg-rose-500/15 text-rose-300">flared {p.flared}×</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full history */}
      <div className="card !rounded-3xl">
        <p className="mb-3 font-semibold text-white">History</p>

        {initialEntries.length > 0 && (
          <div className="mb-4 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: "all" as const, label: "All" },
                { value: -1, label: "Flared" },
                { value: 1, label: "Helped" },
                { value: 0, label: "Logged" },
              ].map((f) => (
                <button
                  key={String(f.value)}
                  onClick={() => setEffectFilter(f.value)}
                  className={cn(
                    "badge border transition",
                    effectFilter === f.value
                      ? "border-brand-500 bg-brand-500/20 text-brand-200"
                      : "border-lab-border text-slate-400 hover:text-slate-200"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setKindFilter("all")}
                className={cn(
                  "badge border transition",
                  kindFilter === "all"
                    ? "border-brand-500 bg-brand-500/20 text-brand-200"
                    : "border-lab-border text-slate-400 hover:text-slate-200"
                )}
              >
                All types
              </button>
              {TRIGGER_KINDS.map((k) => (
                <button
                  key={k.id}
                  onClick={() => setKindFilter(k.id)}
                  className={cn(
                    "badge border transition",
                    kindFilter === k.id
                      ? "border-brand-500 bg-brand-500/20 text-brand-200"
                      : "border-lab-border text-slate-400 hover:text-slate-200"
                  )}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {initialEntries.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nothing logged yet. Tick whatever touched your skin today above — patterns show up
            faster than you&apos;d think.
          </p>
        ) : visibleEntries.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing matches those filters.</p>
        ) : (
          <div className="divide-y divide-lab-border">
            {visibleEntries.map((e) => {
              const badge = effectBadge(e.effect);
              return (
                <div key={e.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-white">
                      {e.name}
                      <span className={cn("badge ml-2", badge.cls)}>{badge.label}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {kindLabel(e.kind)} · {formatDate(e.date)}
                      {e.note ? ` · ${e.note}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(e.id)}
                    className="shrink-0 text-slate-600 hover:text-rose-400"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
