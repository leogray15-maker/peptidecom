"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
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

const kindLabel = (id: string) => TRIGGER_KINDS.find((k) => k.id === id)?.label ?? id;

function effectBadge(effect: number) {
  if (effect === 1) return { label: "helped", cls: "bg-emerald-500/15 text-emerald-300" };
  if (effect === -1) return { label: "flared", cls: "bg-rose-500/15 text-rose-300" };
  return { label: "no change", cls: "bg-slate-500/15 text-slate-400" };
}

export function TriggersClient({ initialEntries }: { initialEntries: TriggerItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [effectFilter, setEffectFilter] = useState<number | "all">("all");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [form, setForm] = useState({
    date: dateKey(),
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

  /** The user's own patterns: anything logged 2+ times, summarised. */
  const patterns = useMemo(() => {
    const byName = new Map<string, { name: string; kind: string; helped: number; flared: number; total: number }>();
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

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/tsw/triggers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, name: form.name.trim(), note: form.note.trim() || null }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't save.");
      return;
    }
    setForm({ ...form, name: "", effect: 0, note: "" });
    setOpen(false);
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/tsw/triggers?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => setOpen((v) => !v)} className="btn-primary">
          <Plus className="h-4 w-4" /> Log something
        </button>
      </div>

      {open && (
        <form onSubmit={save} className="card grid gap-4 sm:grid-cols-2">
          <div>
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
            <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              {TRIGGER_KINDS.map((k) => (
                <option key={k.id} value={k.id}>{k.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} max={dateKey()} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
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
            <input className="input" value={form.note} maxLength={1000} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          {error && <p className="text-sm text-rose-400 sm:col-span-2">{error}</p>}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </button>
          </div>
        </form>
      )}

      {/* Patterns */}
      {patterns.length > 0 && (
        <div className="card">
          <p className="font-semibold text-white">Your patterns</p>
          <p className="mt-1 text-sm text-slate-500">
            What your own logs suggest — patterns, not verdicts. One-off reactions happen.
          </p>
          <div className="mt-4 space-y-2">
            {patterns.map((p) => (
              <div key={p.name} className="flex items-center justify-between rounded-xl bg-lab-bg px-4 py-3 text-sm">
                <div>
                  <span className="font-medium text-slate-200">{p.name}</span>
                  <span className="ml-2 text-xs text-slate-500">{kindLabel(p.kind)} · logged {p.total}×</span>
                </div>
                <div className="flex gap-2 text-xs">
                  {p.helped > 0 && <span className="badge bg-emerald-500/15 text-emerald-300">helped {p.helped}×</span>}
                  {p.flared > 0 && <span className="badge bg-rose-500/15 text-rose-300">flared {p.flared}×</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div className="card">
        <p className="mb-3 font-semibold text-white">History</p>

        {initialEntries.length > 0 && (
          <div className="mb-4 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: "all" as const, label: "All" },
                { value: -1, label: "Flared" },
                { value: 1, label: "Helped" },
                { value: 0, label: "No change" },
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
            Nothing logged yet. Start with whatever touched your skin today — moisturisers,
            water temperature, fabrics, foods, stress. Patterns show up faster than you&apos;d think.
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
                  <button onClick={() => remove(e.id)} className="shrink-0 text-slate-600 hover:text-rose-400" aria-label="Delete entry">
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
