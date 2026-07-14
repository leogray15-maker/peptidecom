"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pin, PinOff, Trash2 } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";

export interface NoteItem {
  id: string;
  body: string;
  authorEmail: string;
  pinned: boolean;
  createdAt: string; // ISO
}

/** Timeline of admin notes on a customer, with add / pin / delete. */
export function NotesPanel({ userId, notes }: { userId: string; notes: NoteItem[] }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="card">
      <h2 className="mb-3 font-semibold text-white">Notes</h2>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!body.trim()) return;
          const ok = await call(() =>
            fetch("/api/admin/notes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, body: body.trim() }),
            })
          );
          if (ok) setBody("");
        }}
      >
        <textarea
          className="input min-h-20"
          placeholder="Add a note — calls, context, anything future-you should know…"
          value={body}
          disabled={busy}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="mt-2 flex justify-end">
          <button type="submit" className="btn-primary" disabled={busy || !body.trim()}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Add note
          </button>
        </div>
      </form>

      {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}

      <div className="mt-4 space-y-3">
        {notes.length === 0 && <p className="text-sm text-slate-400">No notes yet.</p>}
        {notes.map((n) => (
          <div
            key={n.id}
            className={cn(
              "rounded-xl border p-3",
              n.pinned ? "border-brand-500/40 bg-brand-950/30" : "border-lab-border bg-lab-bg"
            )}
          >
            <p className="whitespace-pre-wrap text-sm text-slate-200">{n.body}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="truncate text-xs text-slate-500">
                {n.authorEmail} · {timeAgo(new Date(n.createdAt))}
                {n.pinned && <span className="ml-1 text-brand-300">· pinned</span>}
              </p>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-brand-300"
                  title={n.pinned ? "Unpin" : "Pin to top"}
                  disabled={busy}
                  onClick={() =>
                    call(() =>
                      fetch(`/api/admin/notes/${n.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ pinned: !n.pinned }),
                      })
                    )
                  }
                >
                  {n.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-rose-400"
                  title="Delete note"
                  disabled={busy}
                  onClick={() => {
                    if (!window.confirm("Delete this note?")) return;
                    call(() => fetch(`/api/admin/notes/${n.id}`, { method: "DELETE" }));
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
