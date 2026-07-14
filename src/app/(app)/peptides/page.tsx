import { DoseScheduleSection } from "@/components/dose-schedule";
import { PageHeader } from "@/components/page-header";
import { PeptidesClient } from "@/components/peptides-client";
import { getCurrentUser } from "@/lib/auth";
import type { PeptideProtocol } from "@/lib/protocol-schedule";
import { safe } from "@/lib/safe-db";
import { type PeptideLog, listPeptideLogs, listProtocols, tswKey } from "@/lib/tsw-db";

export const metadata = { title: "Peptide tracker" };

export default async function PeptidesPage() {
  const user = await getCurrentUser();
  const uid = user ? tswKey(user) : null;
  const [entries, protocols] = uid
    ? await Promise.all([
        safe(() => listPeptideLogs(uid), [] as PeptideLog[]),
        safe(() => listProtocols(uid), [] as PeptideProtocol[]),
      ])
    : [[], []];

  return (
    <div>
      <PageHeader
        title="Peptide tracker"
        subtitle="Every dose on the record — what you took, how much, when, and how it's going."
      />
      <div className="mb-6">
        <DoseScheduleSection
          protocols={protocols}
          logs={entries.map((e) => ({ date: e.date, peptide: e.peptide, site: e.site ?? null }))}
        />
      </div>
      <PeptidesClient
        initialEntries={entries.map((e) => ({
          id: e.id,
          date: e.date,
          peptide: e.peptide,
          doseMg: e.doseMg,
          purpose: e.purpose ?? null,
          site: e.site ?? null,
          note: e.note,
        }))}
      />
      <p className="mt-8 text-center text-xs text-slate-500">
        For research logging purposes only · not medical advice or dosing guidance.
      </p>
    </div>
  );
}
