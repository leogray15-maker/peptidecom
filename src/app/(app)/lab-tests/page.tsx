import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { FlaskConical, FileText } from "lucide-react";

export const metadata = { title: "Lab tests" };

export default async function LabTestsPage() {
  const results = await prisma.labResult.findMany({
    orderBy: { createdAt: "desc" },
    include: { vendor: true, submittedBy: { select: { name: true } } },
    take: 100,
  });

  return (
    <div>
      <PageHeader
        title="Lab test library"
        subtitle="Third-party purity results tied to real vendors and batches."
      />

      {results.length === 0 ? (
        <div className="card text-sm text-slate-400">
          No lab results uploaded yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-lab-border">
          <table className="w-full text-sm">
            <thead className="bg-lab-card text-left text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Peptide</th>
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Batch</th>
                <th className="px-4 py-3 font-medium">Purity</th>
                <th className="px-4 py-3 font-medium">Lab</th>
                <th className="px-4 py-3 font-medium">Tested</th>
                <th className="px-4 py-3 font-medium">COA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lab-border">
              {results.map((r) => (
                <tr key={r.id} className="bg-lab-bg/40">
                  <td className="px-4 py-3 font-medium text-white">
                    <span className="inline-flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-brand-300" />
                      {r.peptide}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{r.vendor?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{r.batch ?? "—"}</td>
                  <td className="px-4 py-3">
                    {r.purityPct != null ? (
                      <span
                        className={
                          r.purityPct >= 98
                            ? "font-semibold text-emerald-300"
                            : r.purityPct >= 95
                            ? "font-semibold text-amber-300"
                            : "font-semibold text-red-300"
                        }
                      >
                        {r.purityPct}%
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{r.labName ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {r.testedAt ? formatDate(r.testedAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.fileUrl ? (
                      <a
                        href={r.fileUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-brand-300 hover:text-brand-200"
                      >
                        <FileText className="h-4 w-4" /> View
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
