"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface Log {
  id: string;
  date: string;
  weightKg: number | null;
  waistCm: number | null;
  bodyFatPct: number | null;
  mood: number | null;
  sideEffects: string | null;
  notes: string | null;
}

export function ProgressClient({ initialLogs }: { initialLogs: Log[] }) {
  const router = useRouter();
  const [logs] = useState<Log[]>(initialLogs);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    weightKg: "",
    waistCm: "",
    bodyFatPct: "",
    mood: "",
    sideEffects: "",
    notes: "",
  });

  const chartData = logs
    .filter((l) => l.weightKg != null || l.waistCm != null)
    .map((l) => ({
      date: formatDate(l.date, { day: "numeric", month: "short" }),
      weight: l.weightKg ?? undefined,
      waist: l.waistCm ?? undefined,
    }));

  const latest = logs[logs.length - 1];
  const first = logs.find((l) => l.weightKg != null);
  const weightDelta =
    latest?.weightKg != null && first?.weightKg != null
      ? latest.weightKg - first.weightKg
      : null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const num = (v: string) => (v.trim() === "" ? null : parseFloat(v));
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date(form.date).toISOString(),
        weightKg: num(form.weightKg),
        waistCm: num(form.waistCm),
        bodyFatPct: num(form.bodyFatPct),
        mood: form.mood ? parseInt(form.mood, 10) : null,
        sideEffects: form.sideEffects || null,
        notes: form.notes || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  async function remove(id: string) {
    await fetch(`/api/progress?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => setOpen((v) => !v)} className="btn-primary">
          <Plus className="h-4 w-4" /> Log entry
        </button>
      </div>

      {open && (
        <form onSubmit={save} className="card grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Weight (kg)</label>
            <input type="number" step="0.1" className="input" value={form.weightKg}
              onChange={(e) => setForm({ ...form, weightKg: e.target.value })} />
          </div>
          <div>
            <label className="label">Waist (cm)</label>
            <input type="number" step="0.1" className="input" value={form.waistCm}
              onChange={(e) => setForm({ ...form, waistCm: e.target.value })} />
          </div>
          <div>
            <label className="label">Body fat (%)</label>
            <input type="number" step="0.1" className="input" value={form.bodyFatPct}
              onChange={(e) => setForm({ ...form, bodyFatPct: e.target.value })} />
          </div>
          <div>
            <label className="label">Mood (1–5)</label>
            <input type="number" min={1} max={5} className="input" value={form.mood}
              onChange={(e) => setForm({ ...form, mood: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Side effects</label>
            <input className="input" value={form.sideEffects}
              onChange={(e) => setForm({ ...form, sideEffects: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <textarea className="input min-h-20" value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save entry
            </button>
          </div>
        </form>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-slate-400">Latest weight</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {latest?.weightKg != null ? `${latest.weightKg} kg` : "—"}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-400">Total change</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {weightDelta != null
              ? `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} kg`
              : "—"}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-400">Entries logged</p>
          <p className="mt-1 text-2xl font-bold text-white">{logs.length}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <p className="mb-4 font-semibold text-white">Trend</p>
        {chartData.length > 1 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#111a2e",
                    border: "1px solid #1e293b",
                    borderRadius: 12,
                    color: "#e2e8f0",
                  }}
                />
                <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#598bff" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="waist" name="Waist (cm)" stroke="#34d399" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-slate-500">
            Log at least two entries with weight or waist to see your trend.
          </p>
        )}
      </div>

      {/* History */}
      <div className="card">
        <p className="mb-4 font-semibold text-white">History</p>
        {logs.length === 0 ? (
          <p className="text-sm text-slate-500">No entries yet.</p>
        ) : (
          <div className="divide-y divide-lab-border">
            {[...logs].reverse().map((l) => (
              <div key={l.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-white">{formatDate(l.date)}</p>
                  <p className="text-slate-400">
                    {[
                      l.weightKg != null && `${l.weightKg}kg`,
                      l.waistCm != null && `${l.waistCm}cm waist`,
                      l.bodyFatPct != null && `${l.bodyFatPct}% bf`,
                      l.mood != null && `mood ${l.mood}/5`,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                  {l.sideEffects && (
                    <p className="mt-0.5 text-xs text-amber-300/80">Side effects: {l.sideEffects}</p>
                  )}
                </div>
                <button
                  onClick={() => remove(l.id)}
                  className="text-slate-500 hover:text-red-400"
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
