import { PageHeader } from "@/components/page-header";
import { PeptidesClient } from "@/components/peptides-client";
import { getCurrentUser } from "@/lib/auth";
import { safe } from "@/lib/safe-db";
import { type PeptideLog, listPeptideLogs, tswKey } from "@/lib/tsw-db";

export const metadata = { title: "Peptide tracker" };

export default async function PeptidesPage() {
  const user = await getCurrentUser();
  const entries = user
    ? await safe(() => listPeptideLogs(tswKey(user)), [] as PeptideLog[])
    : [];

  return (
    <div>
      <PageHeader
        title="Peptide tracker"
        subtitle="Every dose on the record — what you took, how much, when, and how it's going."
      />
      <PeptidesClient
        initialEntries={entries.map((e) => ({
          id: e.id,
          date: e.date,
          peptide: e.peptide,
          doseMg: e.doseMg,
          note: e.note,
        }))}
      />
      <p className="mt-8 text-center text-xs text-slate-500">
        For research logging purposes only · not medical advice or dosing guidance.
      </p>
    </div>
  );
}
