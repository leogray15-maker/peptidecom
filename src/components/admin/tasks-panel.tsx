"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Circle, CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { PriorityBadge } from "@/components/admin/badges";

export interface TaskItem {
  id: string;
  title: string;
  details: string | null;
  status: "OPEN" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueAt: string | null; // ISO
  user: { id: string; name: string | null; email: string } | null;
}

/** Follow-up tasks list with create / complete / delete. Used both on the
 * global tasks page and scoped to one customer on their profile. */
export function TasksPanel({
  tasks,
  userId,
  showCustomer = false,
  title = "Tasks",
}: {
  tasks: TaskItem[];
  userId?: string; // when set, new tasks are linked to this customer
  showCustomer?: boolean;
  title?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", details: "", priority: "MEDIUM", dueAt: "" });

  async function call(fn: () => Promise<Response>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Something went wrong.");
      }
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const openTasks = tasks.filter((t) => t.status === "OPEN");
  const doneTasks = tasks.filter((t) => t.status === "DONE");

  const overdue = (t: TaskItem) =>
    t.status === "OPEN" && t.dueAt !== null && new Date(t.dueAt).getTime() < Date.now();

  const renderTask = (t: TaskItem) => (
    <div
      key={t.id}
      className={cn(
        "flex items-start gap-3 rounded-xl border border-lab-border bg-lab-bg p-3",
        t.status === "DONE" && "opacity-60"
      )}
    >
      <button
        type="button"
        disabled={busy}
        title={t.status === "OPEN" ? "Mark done" : "Reopen"}
        className="mt-0.5 shrink-0 text-slate-500 transition hover:text-brand-300"
        onClick={() =>
          call(() =>
            fetch(`/api/admin/tasks/${t.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: t.status === "OPEN" ? "DONE" : "OPEN" }),
            })
          )
        }
      >
        {t.status === "DONE" ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium text-white", t.status === "DONE" && "line-through")}>
          {t.title}
        </p>
        {t.details && <p className="mt-0.5 whitespace-pre-wrap text-xs text-slate-400">{t.details}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <PriorityBadge priority={t.priority} />
          {t.dueAt && (
            <span className={overdue(t) ? "font-medium text-rose-400" : undefined}>
              due {formatDate(t.dueAt)}
              {overdue(t) && " · overdue"}
            </span>
          )}
          {showCustomer && t.user && (
            <Link href={`/admin/customers/${t.user.id}`} className="text-brand-300 hover:text-brand-200">
              {t.user.name ?? t.user.email}
            </Link>
          )}
        </div>
      </div>
      <button
        type="button"
        disabled={busy}
        title="Delete task"
        className="shrink-0 rounded-lg p-1 text-slate-600 transition hover:bg-white/5 hover:text-rose-400"
        onClick={() => {
          if (!window.confirm("Delete this task?")) return;
          call(() => fetch(`/api/admin/tasks/${t.id}`, { method: "DELETE" }));
        }}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-white">{title}</h2>
        <button type="button" className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => setOpen((v) => !v)}>
          <Plus className="h-4 w-4" /> New task
        </button>
      </div>

      {open && (
        <form
          className="mb-4 space-y-3 rounded-xl border border-lab-border bg-lab-bg p-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!form.title.trim()) return;
            const ok = await call(() =>
              fetch("/api/admin/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: form.title.trim(),
                  details: form.details.trim() || undefined,
                  priority: form.priority,
                  dueAt: form.dueAt || undefined,
                  userId,
                }),
              })
            );
            if (ok) {
              setForm({ title: "", details: "", priority: "MEDIUM", dueAt: "" });
              setOpen(false);
            }
          }}
        >
          <input
            className="input"
            placeholder="What needs doing?"
            value={form.title}
            disabled={busy}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className="input min-h-16"
            placeholder="Details (optional)"
            value={form.details}
            disabled={busy}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Priority"
              className="input !w-auto"
              value={form.priority}
              disabled={busy}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
            <input
              aria-label="Due date"
              type="date"
              className="input !w-auto"
              value={form.dueAt}
              disabled={busy}
              onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
            />
            <button type="submit" className="btn-primary ml-auto" disabled={busy || !form.title.trim()}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Add
            </button>
          </div>
        </form>
      )}

      {error && <p className="mb-3 text-sm text-rose-400">{error}</p>}

      <div className="space-y-2">
        {openTasks.length === 0 && doneTasks.length === 0 && (
          <p className="text-sm text-slate-400">No tasks yet.</p>
        )}
        {openTasks.map(renderTask)}
        {doneTasks.length > 0 && (
          <>
            <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-slate-600">Done</p>
            {doneTasks.map(renderTask)}
          </>
        )}
      </div>
    </div>
  );
}
