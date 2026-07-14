import Link from "next/link";
import { ArrowRight, Calculator, Clock, Syringe } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PEPTIDE_PRESETS } from "@/lib/peptides";
import { goalEmoji, goalLabel } from "@/lib/tsw";

export const metadata = { title: "Peptide library" };

/** Static reference library built from the calculator presets — half-life,
 * route, typical research ranges and a plain-English overview per compound.
 * Every card deep-links into the calculator and the protocol builder. */
export default function LibraryPage() {
  const peptides = PEPTIDE_PRESETS.filter((p) => p.slug !== "custom");

  const fmtDose = (mcg: number) =>
    mcg >= 1000 ? `${Math.round((mcg / 1000) * 100) / 100} mg` : `${mcg} mcg`;

  return (
    <div>
      <PageHeader
        title="Peptide library"
        subtitle="What each compound is, how long it lasts, and how research protocols typically run it — in plain English."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {peptides.map((p) => (
          <article key={p.slug} className="card flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-white">{p.name}</h2>
              <span className="badge bg-brand-900/60 text-brand-200">{p.category}</span>
              {p.goals?.map((g) => (
                <span key={g} className="badge border border-lab-border text-slate-400" title={goalLabel(g) ?? g}>
                  {goalEmoji(g)} {goalLabel(g)}
                </span>
              ))}
            </div>
            {p.aka && <p className="mt-1 text-xs text-slate-500">Also known as: {p.aka}</p>}
            {p.description && (
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{p.description}</p>
            )}

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-lab-border bg-lab-bg p-3">
                <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3 w-3" /> Half-life
                </dt>
                <dd className="mt-1 font-medium text-slate-200">{p.halfLife ?? "—"}</dd>
              </div>
              <div className="rounded-xl border border-lab-border bg-lab-bg p-3">
                <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Syringe className="h-3 w-3" /> Route
                </dt>
                <dd className="mt-1 font-medium text-slate-200">{p.route ?? "—"}</dd>
              </div>
              <div className="col-span-2 rounded-xl border border-lab-border bg-lab-bg p-3">
                <dt className="text-xs text-slate-500">Typical research range</dt>
                <dd className="mt-1 font-medium text-slate-200">
                  {fmtDose(p.typicalDoseMcg[0])}–{fmtDose(p.typicalDoseMcg[1])} · {p.frequency}
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    vials: {p.commonVialMg.join(" / ")} mg
                  </span>
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-lab-border pt-4">
              <Link href={`/calculator?p=${p.slug}`} className="btn-secondary !py-1.5 text-xs">
                <Calculator className="h-3.5 w-3.5" /> Open in calculator
              </Link>
              <Link href="/peptides" className="btn-ghost !py-1.5 text-xs">
                Start a protocol <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-slate-500">
        Reference information for research and educational purposes only — not medical advice,
        not dosing guidance, and products discussed are not for human consumption.
      </p>
    </div>
  );
}
