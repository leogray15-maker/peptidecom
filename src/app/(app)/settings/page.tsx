import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { ManageBillingButton } from "@/components/manage-billing-button";

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
      </div>
    </div>
  );
}
