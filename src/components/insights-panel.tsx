import { FlaskConical, Sparkles, Users } from "lucide-react";
import type { CohortStatement, PersonalInsight } from "@/lib/insights";

/** Dashboard insights: one personal card (from the member's own data) plus a
 * few rotating cohort stats. Renders nothing at all when there's nothing
 * worth saying — an empty shell would just be noise. */
export function InsightsPanel({
  personal,
  cohort,
}: {
  personal: PersonalInsight | null;
  cohort: CohortStatement[];
}) {
  if (!personal && cohort.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4.5 w-4.5 text-brand-300" />
        <h2 className="text-lg font-semibold text-white">From the lab data</h2>
      </div>
      <div className="mt-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {personal && (
          <div className="card border-brand-500/40 bg-gradient-to-br from-brand-950/40 to-lab-card">
            <div className="flex items-center gap-2 text-brand-300">
              <Sparkles className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-widest">Your data</p>
            </div>
            <p className="mt-2 font-semibold text-white">{personal.headline}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{personal.detail}</p>
          </div>
        )}
        {cohort.map((s) => (
          <div key={s.id} className="card">
            <div className="flex items-center gap-2 text-slate-500">
              <Users className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-widest">The community</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{s.text}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Community stats are anonymised averages across members ({">"}= 20 people behind every
        number) — patterns, not predictions. The personal card is computed from your own logs
        and never leaves your account.
      </p>
    </div>
  );
}
