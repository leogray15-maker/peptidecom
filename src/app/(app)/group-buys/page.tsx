import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { JoinButton } from "@/components/join-button";
import { Users } from "lucide-react";

export const metadata = { title: "Group buys" };

const statusColors: Record<string, string> = {
  OPEN: "bg-emerald-500/15 text-emerald-300",
  LOCKED: "bg-amber-500/15 text-amber-300",
  ORDERED: "bg-brand-500/15 text-brand-200",
  SHIPPED: "bg-brand-500/15 text-brand-200",
  COMPLETE: "bg-slate-500/15 text-slate-300",
  CANCELED: "bg-red-500/15 text-red-300",
};

export default async function GroupBuysPage() {
  const user = await getCurrentUser();
  const buys = await prisma.groupBuy.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { name: true } },
      members: { select: { userId: true, units: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Group buys"
        subtitle="Pool orders to hit volume thresholds and unlock member pricing."
      />

      {buys.length === 0 ? (
        <div className="card text-sm text-slate-400">No group buys running right now.</div>
      ) : (
        <div className="space-y-4">
          {buys.map((b) => {
            const totalUnits = b.members.reduce((s, m) => s + m.units, 0);
            const pct = b.targetUnits ? Math.min(100, (totalUnits / b.targetUnits) * 100) : 0;
            const joined = user ? b.members.some((m) => m.userId === user.id) : false;
            return (
              <div key={b.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{b.title}</h3>
                      <span className={`badge ${statusColors[b.status] ?? ""}`}>{b.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      {b.peptide}
                      {b.vendorName && ` · ${b.vendorName}`}
                      {b.pricePerUnit != null && ` · £${b.pricePerUnit}/unit`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Organised by {b.owner.name}
                      {b.deadline && ` · closes ${formatDate(b.deadline)}`}
                    </p>
                  </div>
                  {b.status === "OPEN" && (
                    <JoinButton groupBuyId={b.id} joined={joined} />
                  )}
                </div>

                {b.targetUnits && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {b.members.length} in · {totalUnits} units
                      </span>
                      <span>target {b.targetUnits}</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-lab-border">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}

                {b.details && <p className="mt-3 text-sm text-slate-400">{b.details}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
