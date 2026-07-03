"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function CommentForm({ postId }: { postId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, content }),
    });
    setSaving(false);
    if (res.ok) {
      setContent("");
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <textarea
        className="input min-h-24"
        placeholder="Add a comment…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={saving || !content.trim()}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Comment
        </button>
      </div>
    </form>
  );
}
