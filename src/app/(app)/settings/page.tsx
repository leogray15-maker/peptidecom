import Link from "next/link";
import { Download, ShieldCheck } from "lucide-react";
import { ConditionSettings } from "@/components/condition-picker";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/auth";
import { getCondition } from "@/lib/conditions";
import { safe } from "@/lib/safe-db";
import { type TswProfile, getProfile, tswKey } from "@/lib/tsw-db";
import { formatDate } from "@/lib/utils";
import { ManageBillingButton } from "@/components/manage-billing-button";

const exports = [
  { data: "logs", label: "Daily skin logs" },
  { data: "triggers", label: "Triggers" },
  { data: "journal", label: "Journal" },
  { data: "peptides", label: "Peptide doses" },
];

export const metadata = { title: "Settings" };

const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  TRIALING: "Trialing",
  PAST_DUE: "Past due",
  CANCELED: "Canceled",
  INCOMPLETE: "Incomplete",
  NONE: "None",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const profile = await safe(() => getProfile(tswKey(user)), {} as TswProfile);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your account and membership." />

      <div className="space-y-6">
        <section className="card">
          <h2 className="text-lg font-semibold text-white">Profile</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">Name</dt>
              <dd className="text-white">{user.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Username</dt>
              <dd className="text-white">@{user.username}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Email</dt>
              <dd className="text-white">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Role</dt>
              <dd className="text-white">{user.role}</dd>
            </div>
          </dl>
        </section>

        <section className="card">
          <h2 className="text-lg font-semibold text-white">Membership</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">Status</dt>
              <dd>
                <span
                  className={`badge ${
                    user.subscriptionStatus === "ACTIVE" || user.subscriptionStatus === "TRIALING"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {statusLabels[user.subscriptionStatus] ?? user.subscriptionStatus}
                </span>
              </dd>
            </div>
            {user.stripeCurrentPeriodEnd && (
              <div className="flex justify-between">
                <dt className="text-slate-400">Renews / ends</dt>
                <dd className="text-white">{formatDate(user.stripeCurrentPeriodEnd)}</dd>
              </div>
            )}
          </dl>
          <div className="mt-5">
            <ManageBillingButton />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Update your card, switch plans or cancel through the secure Stripe portal.
          </p>
        </section>

        <section className="card">
          <h2 className="text-lg font-semibold text-white">Condition</h2>
          <p className="mt-1 text-sm text-slate-400">
            The tracker, stages and trigger suggestions adapt to what you&apos;re dealing with.
          </p>
          <div className="mt-4">
            <ConditionSettings current={getCondition(profile.condition).id} />
          </div>
        </section>

        <section className="card">
          <h2 className="text-lg font-semibold text-white">Your data</h2>
          <p className="mt-1 text-sm text-slate-400">
            Everything you&apos;ve logged is yours. Download it as CSV — open it in any
            spreadsheet, or bring it to an appointment.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {exports.map((e) => (
              <a key={e.data} href={`/api/tsw/export?data=${e.data}`} className="btn-secondary" download>
                <Download className="h-4 w-4" /> {e.label}
              </a>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="text-lg font-semibold text-white">Privacy &amp; sources</h2>
          <p className="mt-1 text-sm text-slate-400">
            See exactly what&apos;s processed on your device, control optional on-device features,
            and read the clinical sources behind the EASI, POEM and ingredient tools.
          </p>
          <Link href="/privacy-sources" className="btn-secondary mt-4">
            <ShieldCheck className="h-4 w-4" /> Open Privacy &amp; Sources
          </Link>
        </section>
      </div>
    </div>
  );
}
