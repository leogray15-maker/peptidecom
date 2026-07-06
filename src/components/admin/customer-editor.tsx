"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Gift, Loader2, PhoneCall } from "lucide-react";
import { adminFetch } from "@/lib/admin-client";

interface EditableCustomer {
  id: string;
  role: "MEMBER" | "MODERATOR" | "ADMIN";
  verified: boolean;
  comped: boolean;
  crmStage: string | null;
  crmTags: string[];
  lastContactedAt: string | null;
}

const STAGES = [
  { value: "", label: "Auto (from billing)" },
  { value: "LEAD", label: "Lead" },
  { value: "TRIAL", label: "Trial" },
  { value: "ACTIVE", label: "Active" },
  { value: "AT_RISK", label: "At risk" },
  { value: "CHURNED", label: "Churned" },
  { value: "VIP", label: "VIP" },
];

/** Inline CRM controls for a customer: role, verified badge, lifecycle stage,
 * tags and "mark contacted". Each change PATCHes and refreshes the page. */
export function CustomerEditor({ customer }: { customer: EditableCustomer }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState(customer.crmTags.join(", "));

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      await adminFetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-white">CRM controls</h2>
        {busy && <Loader2 className="h-4 w-4 animate-spin text-brand-300" />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="crm-stage">Lifecycle stage</label>
          <select
            id="crm-stage"
            className="input"
            disabled={busy}
            value={customer.crmStage ?? ""}
            onChange={(e) => patch({ crmStage: e.target.value || null })}
          >
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="crm-role">Role</label>
          <select
            id="crm-role"
            className="input"
            disabled={busy}
            value={customer.role}
            onChange={(e) => patch({ role: e.target.value })}
          >
            <option value="MEMBER">Member</option>
            <option value="MODERATOR">Moderator</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="crm-tags">Tags (comma-separated)</label>
          <div className="flex gap-2">
            <input
              id="crm-tags"
              className="input"
              value={tags}
              disabled={busy}
              placeholder="e.g. whatsapp-og, high-touch, refund-risk"
              onChange={(e) => setTags(e.target.value)}
            />
            <button
              type="button"
              className="btn-secondary shrink-0"
              disabled={busy}
              onClick={() =>
                patch({
                  crmTags: tags
                    .split(",")
                    .map((t) => t.trim().toLowerCase())
                    .filter(Boolean),
                })
              }
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-lab-border pt-4">
        <button
          type="button"
          className={customer.comped ? "btn-secondary !border-emerald-500/40 !text-emerald-300" : "btn-secondary"}
          disabled={busy}
          title="Full membership without a Stripe subscription — for testers, friends and comps."
          onClick={() => patch({ comped: !customer.comped })}
        >
          <Gift className="h-4 w-4" />
          {customer.comped ? "Revoke free access" : "Grant free access"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={busy}
          onClick={() => patch({ verified: !customer.verified })}
        >
          <BadgeCheck className="h-4 w-4" />
          {customer.verified ? "Remove verified badge" : "Mark verified"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={busy}
          onClick={() => patch({ contacted: true })}
        >
          <PhoneCall className="h-4 w-4" /> Mark contacted today
        </button>
        {customer.lastContactedAt && (
          <p className="text-xs text-slate-500">
            Last contacted {new Date(customer.lastContactedAt).toLocaleDateString("en-GB")}
          </p>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
    </div>
  );
}
