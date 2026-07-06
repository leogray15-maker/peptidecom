"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trophy } from "lucide-react";

export function StoryForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [monthsIn, setMonthsIn] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/tsw/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        body,
        monthsIn: monthsIn.trim() === "" ? null : parseInt(monthsIn, 10),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't post your story.");
      return;
    }
    setTitle("");
    setBody("");
    setMonthsIn("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Trophy className="h-4 w-4" /> Share your story
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <p className="text-sm text-slate-400">
        Someone in their worst week will read this. Tell them what it was like, what changed,
        and what you&apos;d say to yourself back then.
      </p>
      <input
        className="input"
        placeholder="Title — e.g. 18 months in: I wore short sleeves again"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        minLength={3}
        maxLength={160}
      />
      <input
        className="input"
        type="number"
        min={0}
        max={600}
        placeholder="How many months into withdrawal are you? (optional)"
        value={monthsIn}
        onChange={(e) => setMonthsIn(e.target.value)}
      />
      <textarea
        className="input min-h-40"
        placeholder="Your story…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        minLength={20}
      />
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Post to the wall
        </button>
      </div>
    </form>
  );
}
