"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Check,
  Flame,
  Loader2,
  Pause,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { INJECTION_SITES, PEPTIDE_PRESETS, siteLabel, suggestNextSite } from "@/lib/peptides";
import {
  type PeptideProtocol,
  WEEKDAY_LABELS,
  computeAdherence,
  scheduleLabel,
} from "@/lib/protocol-schedule";
import { addDays } from "@/lib/insights";
import { RESEARCH_GOALS, dateKey, goalEmoji, goalLabel } from "@/lib/tsw";
import { cn } from "@/lib/utils";

/** The habit loop for the peptide tracker: set a protocol once, then the
 * Today card tells you what's due and logs it in one tap. */
export function DoseScheduleSection({
  protocols,
  logs,
}: {
  protocols: PeptideProtocol[];
  logs: { date: string; peptide: string; site?: string | null }[];
}) {
  const router = useRouter();
  const today = dateKey();
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Per-protocol injection-site choice, pre-seeded with the rotation
  // suggestion the first time each row renders.
  const [sites, setSites] = useState<Record<string, string>>({});

  const adherence = useMemo(
    () => computeAdherence(protocols, logs, today, addDays),
    [protocols, logs, today]
  );
  const dueCount = adherence.today.length;
  const doneCount = adherence.today.filter((t) => t.logged).length;

  /** One-tap log: writes a normal dose entry, so history/totals just work. */
  async function logDose(p: PeptideProtocol, site: string | null) {
    setBusy(p.id);
    setError(null);
    const res = await fetch("/api/peptides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: today,
        peptide: p.peptide,
        doseMg: p.doseMg,
        purpose: p.purpose ?? null,
        site,
        note: null,
      }),
    });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't log the dose.");
      return;
    }
    router.refresh();
  }

  async function toggleActive(p: PeptideProtocol) {
    setBusy(p.id);
    await fetch("/api/peptides/protocols", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, active: !p.active }),
    });
    setBusy(null);
    router.refresh();
  }

  async function remove(p: PeptideProtocol) {
    if (!confirm(`Delete the ${p.peptide} protocol? Your logged doses stay.`)) return;
    setBusy(p.id);
    await fetch(`/api/peptides/protocols?id=${p.id}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Today */}
      {dueCount > 0 && (
        <div className="card border-brand-500/30 bg-gradient-to-br from-brand-950/40 to-lab-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-white">Today&apos;s schedule</p>
              <p className="mt-0.5 text-sm text-slate-400">
                {doneCount} of {dueCount} dose{dueCount === 1 ? "" : "s"} logged
                {doneCount === dueCount ? " — all done ✦" : ""}
              </p>
            </div>
            {adherence.streak > 0 && (
              <span className="badge bg-amber-500/15 text-amber-300" title="Consecutive days with every scheduled dose logged">
                <Flame className="h-3.5 w-3.5" /> {adherence.streak}-day streak
              </span>
            )}
          </div>

          {/* Progress */}
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-lab-bg">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${dueCount ? (doneCount / dueCount) * 100 : 0}%` }}
            />
          </div>

          <div className="mt-4 space-y-2">
            {adherence.today.map(({ protocol: p, logged }) => {
              const rotation = suggestNextSite(logs, p.peptide);
              const site = sites[p.id] ?? rotation?.suggested ?? "";
              return (
                <div
                  key={p.id}
                  className={cn(
                    "rounded-xl border px-4 py-2.5",
                    logged ? "border-emerald-500/30 bg-emerald-500/5" : "border-lab-border bg-lab-bg"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">
                        {p.peptide}
                        <span className="ml-2 text-xs text-slate-400">{p.doseMg} mg</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {scheduleLabel(p.schedule)}
                        {p.time ? ` · ${p.time}` : ""}
                        {p.purpose ? ` · ${goalEmoji(p.purpose)} ${goalLabel(p.purpose)}` : ""}
                      </p>
                    </div>
                    {logged ? (
                      <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-emerald-300">
                        <Check className="h-4 w-4" /> Logged
                      </span>
                    ) : (
                      <div className="flex shrink-0 items-center gap-2">
                        <select
                          className="input !w-auto !py-1 text-xs"
                          value={site}
                          onChange={(e) => setSites((cur) => ({ ...cur, [p.id]: e.target.value }))}
                          aria-label="Injection site"
                        >
                          <option value="">Site —</option>
                          {INJECTION_SITES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                              {rotation?.suggested === s.id ? " ← next" : ""}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => logDose(p, site || null)}
                          disabled={busy === p.id}
                          className="btn-primary !px-4 !py-1.5 text-xs"
                        >
                          {busy === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Log"}
                        </button>
                      </div>
                    )}
                  </div>
                  {!logged && rotation && (
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      Rotation: last was {siteLabel(rotation.last)?.toLowerCase()} — {siteLabel(rotation.suggested)?.toLowerCase()} is due a turn.
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Last 7 days */}
          <div className="mt-4 flex items-center gap-2">
            {adherence.week.map((d) => (
              <span
                key={d.date}
                title={`${d.date}: ${d.logged}/${d.due} scheduled doses logged`}
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  d.due === 0
                    ? "border border-lab-border"
                    : d.logged >= d.due
                      ? "bg-emerald-400"
                      : d.logged > 0
                        ? "bg-amber-400"
                        : "bg-lab-bg ring-1 ring-lab-border"
                )}
              />
            ))}
            <span className="ml-1 text-[11px] text-slate-500">last 7 days</span>
          </div>
          {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
        </div>
      )}

      {/* Protocol manager */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 font-semibold text-white">
              <CalendarClock className="h-4 w-4 text-brand-300" /> My protocols
            </p>
            <p className="mt-0.5 text-sm text-slate-500">
              Set the schedule once — every day it becomes a one-tap checklist above.
            </p>
          </div>
          <button onClick={() => setFormOpen((v) => !v)} className="btn-secondary">
            <Plus className="h-4 w-4" /> New protocol
          </button>
        </div>

        {formOpen && <ProtocolForm onDone={() => setFormOpen(false)} />}

        {protocols.length > 0 && (
          <div className="mt-4 divide-y divide-lab-border">
            {protocols.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className={cn("text-sm font-medium", p.active ? "text-white" : "text-slate-500 line-through")}>
                    {p.peptide}
                    <span className="ml-2 text-xs font-normal text-slate-400">{p.doseMg} mg</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {scheduleLabel(p.schedule)}
                    {p.time ? ` · ${p.time}` : ""}
                    {!p.active && " · paused"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => toggleActive(p)}
                    disabled={busy === p.id}
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-slate-200"
                    title={p.active ? "Pause protocol" : "Resume protocol"}
                  >
                    {p.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => remove(p)}
                    disabled={busy === p.id}
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-white/5 hover:text-rose-400"
                    aria-label={`Delete ${p.peptide} protocol`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {protocols.length === 0 && !formOpen && (
          <p className="mt-4 text-sm text-slate-500">
            No protocols yet. Add what you&apos;re running — e.g. BPC-157, 0.5&nbsp;mg, daily —
            and the tracker starts working for you instead of the other way round.
          </p>
        )}
      </div>
    </div>
  );
}

function ProtocolForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [peptide, setPeptide] = useState("");
  const [doseMg, setDoseMg] = useState("");
  const [type, setType] = useState<"daily" | "weekly">("daily");
  const [days, setDays] = useState<number[]>([]);
  const [time, setTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/peptides/protocols", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        peptide: peptide.trim(),
        doseMg: parseFloat(doseMg),
        schedule: type === "daily" ? { type } : { type, days },
        time: time || null,
        purpose: purpose || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't save.");
      return;
    }
    onDone();
    router.refresh();
  }

  return (
    <form onSubmit={save} className="mt-4 grid gap-4 rounded-xl border border-lab-border p-4 sm:grid-cols-2">
      <div>
        <label className="label">Peptide</label>
        <input
          className="input"
          list="peptide-presets-protocol"
          placeholder="e.g. BPC-157"
          value={peptide}
          onChange={(e) => setPeptide(e.target.value)}
          required
          maxLength={80}
        />
        <datalist id="peptide-presets-protocol">
          {PEPTIDE_PRESETS.filter((p) => p.slug !== "custom").map((p) => (
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
          placeholder="e.g. 0.5"
          value={doseMg}
          onChange={(e) => setDoseMg(e.target.value)}
          required
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Schedule</label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setType("daily")}
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-medium transition",
              type === "daily"
                ? "border-brand-500 bg-brand-500/20 text-brand-200"
                : "border-lab-border text-slate-400 hover:text-slate-200"
            )}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => setType("weekly")}
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-medium transition",
              type === "weekly"
                ? "border-brand-500 bg-brand-500/20 text-brand-200"
                : "border-lab-border text-slate-400 hover:text-slate-200"
            )}
          >
            Specific days
          </button>
          {type === "weekly" && (
            <div className="flex gap-1">
              {WEEKDAY_LABELS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    setDays((cur) => (cur.includes(i) ? cur.filter((d) => d !== i) : [...cur, i]))
                  }
                  className={cn(
                    "h-9 w-9 rounded-lg border text-xs font-medium transition",
                    days.includes(i)
                      ? "border-brand-500 bg-brand-500/20 text-brand-200"
                      : "border-lab-border text-slate-500 hover:text-slate-300"
                  )}
                >
                  {label[0]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div>
        <label className="label">Reminder time (optional)</label>
        <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <div>
        <label className="label">Running it for (optional)</label>
        <select className="input" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
          <option value="">—</option>
          {RESEARCH_GOALS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.emoji} {g.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-rose-400 sm:col-span-2">{error}</p>}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <button type="button" className="btn-secondary" onClick={onDone}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving || (type === "weekly" && days.length === 0)}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save protocol
        </button>
      </div>
    </form>
  );
}
