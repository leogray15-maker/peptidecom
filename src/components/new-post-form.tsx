"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PenSquare } from "lucide-react";

export function NewPostForm({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, categoryId: categoryId || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Could not post.");
      return;
    }
    setTitle("");
    setContent("");
    setOpen(false);
    router.push(`/community/${data.id}`);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        <PenSquare className="h-4 w-4" /> New post
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <input
        className="input"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        minLength={3}
      />
      <textarea
        className="input min-h-32"
        placeholder="What do you want to share or ask?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      {categories.length > 0 && (
        <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Post
        </button>
      </div>
    </form>
  );
}
