"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Syringe, Trash2 } from "lucide-react";
import { PEPTIDE_PRESETS } from "@/lib/peptides";
import { RESEARCH_GOALS, dateKey, daysBetween, goalEmoji, goalLabel } from "@/lib/tsw";
import { formatDate } from "@/lib/utils";

export interface PeptideEntry {
  id: string;
  date: string;
  peptide: string;
  doseMg: number;
  purpose: string | null;
  note: string | null;
}

export function PeptidesClient({ initialEntries }: { initialEntries: PeptideEntry[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(initialEntries.length === 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: dateKey(),
    peptide: "",
    doseMg: "",
    purpose: "",
    note: "",
  });

  /** Per-peptide summary: doses logged, last dose, what it's being run for. */
  const summary = useMemo(() => {
    const byPeptide = new Map<
      string,
      { name: string; count: number; lastDate: string; lastDose: number; totalMg: number; purpose: string | null }
    >();
    for (const e of initialEntries) {
      const key = e.peptide.trim().toLowerCase();
      const cur = byPeptide.get(key);
      if (!cur) {
        byPeptide.set(key, {
          name: e.peptide,
          count: 1,
          lastDate: e.date,
          lastDose: e.doseMg,
          totalMg: e.doseMg,
          purpose: e.purpose,
        });
      } else {
        cur.count++;
        cur.totalMg += e.doseMg;
        cur.purpose = cur.purpose ?? e.purpose;
        if (e.date > cur.lastDate) {
          cur.lastDate = e.date;
          cur.lastDose = e.doseMg;
          if (e.purpose) cur.purpose = e.purpose;
        }
      }
    }
    return [...byPeptide.values()].sort((a, b) => b.lastDate.localeCompare(a.lastDate));
  }, [initialEntries]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/peptides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date,
        peptide: form.peptide.trim(),
        doseMg: parseFloat(form.doseMg),
        purpose: form.purpose || null,
        note: form.note.trim() || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't save.");
      return;
    }
    setForm({ ...form, doseMg: "", note: "" });
    setOpen(false);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this dose entry? This can't be undone.")) return;
    await fetch(`/api/peptides?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => setOpen((v) => !v)} className="btn-primary">
          <Plus className="h-4 w-4" /> Log a dose
        </button>
      </div>

      {open && (
        <form onSubmit={save} className="card grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Peptide</label>
            <input
              className="input"
              list="peptide-presets"
              placeholder="e.g. BPC-157"
              value={form.peptide}
              onChange={(e) => setForm({ ...form, peptide: e.target.value })}
              required
              maxLength={80}
            />
            <datalist id="peptide-presets">
              {PEPTIDE_PRESETS.map((p) => (
                <option key={p.slug} value={p.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label">Dose (mg)</label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              max="1000"
              className="input"
              placeholder="e.g. 0.25"
              value={form.doseMg}
              onChange={(e) => setForm({ ...form, doseMg: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={form.date}
              max={dateKey()}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Running it for (optional)</label>
            <select
              className="input"
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            >
              <option value="">—</option>
              {RESEARCH_GOALS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.emoji} {g.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Progress note (optional)</label>
            <input
              className="input"
              placeholder="e.g. Week 3 — skin texture noticeably smoother"
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
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save dose
            </button>
          </div>
        </form>
      )}

      {/* Per-peptide summary */}
      {summary.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summary.map((s) => (
            <div key={s.name} className="card">
              <div className="flex items-center gap-2">
                <Syringe className="h-4 w-4 text-brand-300" />
                <p className="font-semibold text-white">{s.name}</p>
              </div>
              {s.purpose && (
                <span className="badge mt-2 bg-brand-900/60 text-brand-200">
                  {goalEmoji(s.purpose)} {goalLabel(s.purpose)}
                </span>
              )}
              <p className="mt-2 text-sm text-slate-400">
                Last dose <span className="font-medium text-slate-200">{s.lastDose} mg</span> on{" "}
                {formatDate(s.lastDate)}
                <span className="text-slate-500">
                  {" "}·{" "}
                  {daysBetween(s.lastDate, dateKey()) === 0
                    ? "today"
                    : `${daysBetween(s.lastDate, dateKey())} day${daysBetween(s.lastDate, dateKey()) === 1 ? "" : "s"} ago`}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {s.count} dose{s.count === 1 ? "" : "s"} logged ·{" "}
                {Math.round(s.totalMg * 1000) / 1000} mg total
              </p>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      <div className="card">
        <p className="mb-4 font-semibold text-white">Dose history</p>
        {initialEntries.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nothing logged yet. Record each dose — what, how much, when — and your history and
            per-peptide totals build themselves.
          </p>
        ) : (
          <div className="divide-y divide-lab-border">
            {initialEntries.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-white">
                    {e.peptide}
                    <span className="badge ml-2 bg-brand-900/60 text-brand-200">{e.doseMg} mg</span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDate(e.date)}
                    {e.purpose ? ` · ${goalEmoji(e.purpose)} ${goalLabel(e.purpose)}` : ""}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
