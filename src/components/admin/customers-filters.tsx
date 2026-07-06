"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Download, Search } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "member", label: "Active members" },
  { value: "trialing", label: "Trialing" },
  { value: "past_due", label: "Past due" },
  { value: "canceled", label: "Canceled" },
  { value: "free", label: "Free / lead" },
  { value: "founding", label: "Founding" },
];

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "ADMIN", label: "Admins" },
  { value: "MODERATOR", label: "Moderators" },
  { value: "MEMBER", label: "Members" },
];

const SORT_OPTIONS = [
  { value: "", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
  { value: "reputation", label: "Reputation" },
];

/** GET-based filter bar: every change updates the URL so views are linkable. */
export function CustomersFilters() {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page"); // filters reset pagination
    router.push(`/admin/customers?${next.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <form
        className="relative min-w-0 flex-1 basis-56"
        onSubmit={(e) => {
          e.preventDefault();
          const q = new FormData(e.currentTarget).get("q");
          update("q", String(q ?? "").trim());
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          name="q"
          defaultValue={params.get("q") ?? ""}
          placeholder="Search name, email, username…"
          className="input !pl-9"
        />
      </form>
      <select
        aria-label="Filter by status"
        className="input !w-auto"
        value={params.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <select
        aria-label="Filter by role"
        className="input !w-auto"
        value={params.get("role") ?? ""}
        onChange={(e) => update("role", e.target.value)}
      >
        {ROLE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <select
        aria-label="Sort"
        className="input !w-auto"
        value={params.get("sort") ?? ""}
        onChange={(e) => update("sort", e.target.value)}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <a href={`/api/admin/customers/export?${params.toString()}`} className="btn-secondary" title="Export current view as CSV">
        <Download className="h-4 w-4" /> CSV
      </a>
    </div>
  );
}
