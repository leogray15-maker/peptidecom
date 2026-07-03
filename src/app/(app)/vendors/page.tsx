import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { ShieldCheck, Star, ExternalLink } from "lucide-react";

export const metadata = { title: "Vendors" };

export default async function VendorsPage() {
  const vendors = await prisma.vendor.findMany({
    orderBy: [{ verified: "desc" }, { name: "asc" }],
    include: {
      reviews: { select: { rating: true } },
      _count: { select: { labResults: true, reviews: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Vendor directory"
        subtitle="Community-vetted vendors. Verified badges are earned through testing & track record."
      />

      {vendors.length === 0 ? (
        <div className="card text-sm text-slate-400">No vendors listed yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {vendors.map((v) => {
            const avg =
              v.reviews.length > 0
                ? v.reviews.reduce((s, r) => s + r.rating, 0) / v.reviews.length
                : null;
            return (
              <div key={v.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{v.name}</h3>
                    {v.country && <p className="text-xs text-slate-500">{v.country}</p>}
                  </div>
                  {v.verified && (
                    <span className="badge bg-emerald-500/15 text-emerald-300">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified
                    </span>
                  )}
                </div>
                {v.description && (
                  <p className="mt-2 text-sm text-slate-400">{v.description}</p>
                )}
                <div className="mt-4 flex items-center gap-4 text-sm text-slate-300">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-300" />
                    {avg ? avg.toFixed(1) : "—"}
                    <span className="text-slate-500">({v._count.reviews})</span>
                  </span>
                  <span className="text-slate-400">{v._count.labResults} lab tests</span>
                  {v.website && (
                    <a
                      href={v.website}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="ml-auto inline-flex items-center gap-1 text-brand-300 hover:text-brand-200"
                    >
                      Visit <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
