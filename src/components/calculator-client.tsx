"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Syringe } from "lucide-react";
import {
  PEPTIDE_PRESETS,
  SYRINGE_TYPES,
  calculateReconstitution,
} from "@/lib/peptides";

export function CalculatorClient() {
  const [presetSlug, setPresetSlug] = useState("tirzepatide");
  const [vialMg, setVialMg] = useState(10);
  const [bacWaterMl, setBacWaterMl] = useState(2);
  const [doseMcg, setDoseMcg] = useState(2500);
  const [unitsPerMl, setUnitsPerMl] = useState(100);

  const preset = PEPTIDE_PRESETS.find((p) => p.slug === presetSlug);

  const result = useMemo(
    () =>
      calculateReconstitution({
        vialMg,
        bacWaterMl,
        doseMcg,
        syringeUnitsPerMl: unitsPerMl,
      }),
    [vialMg, bacWaterMl, doseMcg, unitsPerMl]
  );

  // Fraction of a full syringe the draw represents (for the visual).
  const fillFraction = Math.max(0, Math.min(1, result.drawUnits / unitsPerMl));

  function applyPreset(slug: string) {
    setPresetSlug(slug);
    const p = PEPTIDE_PRESETS.find((x) => x.slug === slug);
    if (p) {
      setVialMg(p.commonVialMg[Math.floor(p.commonVialMg.length / 2)] ?? vialMg);
      setDoseMcg(p.typicalDoseMcg[0]);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Inputs */}
      <div className="card space-y-5">
        <div>
          <label className="label">Peptide</label>
          <select
            className="input"
            value={presetSlug}
            onChange={(e) => applyPreset(e.target.value)}
          >
            {PEPTIDE_PRESETS.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>
          {preset?.notes && (
            <p className="mt-1.5 text-xs text-slate-500">{preset.notes}</p>
          )}
        </div>

        <div>
          <label className="label">Peptide in vial (mg)</label>
          <input
            type="number"
            className="input"
            min={0}
            step="0.1"
            value={vialMg}
            onChange={(e) => setVialMg(parseFloat(e.target.value) || 0)}
          />
          {preset && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {preset.commonVialMg.map((mg) => (
                <button
                  key={mg}
                  type="button"
                  onClick={() => setVialMg(mg)}
                  className="rounded-lg border border-lab-border px-2.5 py-1 text-xs text-slate-300 hover:border-brand-600 hover:text-white"
                >
                  {mg}mg
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="label">Bacteriostatic water added (ml)</label>
          <input
            type="number"
            className="input"
            min={0}
            step="0.1"
            value={bacWaterMl}
            onChange={(e) => setBacWaterMl(parseFloat(e.target.value) || 0)}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[1, 1.5, 2, 3, 5].map((ml) => (
              <button
                key={ml}
                type="button"
                onClick={() => setBacWaterMl(ml)}
                className="rounded-lg border border-lab-border px-2.5 py-1 text-xs text-slate-300 hover:border-brand-600 hover:text-white"
              >
                {ml}ml
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Desired dose (mcg)</label>
          <input
            type="number"
            className="input"
            min={0}
            step="1"
            value={doseMcg}
            onChange={(e) => setDoseMcg(parseFloat(e.target.value) || 0)}
          />
          {preset && (
            <p className="mt-1.5 text-xs text-slate-500">
              Typical research range: {preset.typicalDoseMcg[0]}–
              {preset.typicalDoseMcg[1]} mcg · {preset.frequency}
            </p>
          )}
        </div>

        <div>
          <label className="label">Syringe type</label>
          <select
            className="input"
            value={unitsPerMl}
            onChange={(e) => setUnitsPerMl(parseInt(e.target.value, 10))}
          >
            {SYRINGE_TYPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center gap-2 text-brand-300">
            <Syringe className="h-5 w-5" />
            <span className="font-semibold text-white">Draw this much</span>
          </div>

          {result.valid ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Stat label="Draw to" value={`${result.drawUnits.toFixed(1)} units`} big />
                <Stat label="Volume" value={`${result.drawMl.toFixed(3)} ml`} big />
                <Stat
                  label="Concentration"
                  value={`${(result.concentrationMcgPerMl / 1000).toFixed(2)} mg/ml`}
                />
                <Stat
                  label="Doses per vial"
                  value={`≈ ${Math.floor(result.dosesPerVial)}`}
                />
              </div>

              {/* Syringe visual */}
              <div className="mt-6">
                <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
                  Syringe fill ({unitsPerMl === 100 ? "U-100, 1 ml" : `${unitsPerMl} units`})
                </p>
                <SyringeVisual fillFraction={fillFraction} unitsPerMl={unitsPerMl} />
                <p className="mt-2 text-sm font-semibold text-white">
                  Draw to {result.drawUnits.toFixed(1)} units
                </p>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    {result.errors.map((e) => (
                      <p key={e}>{e}</p>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                {result.errors.map((e) => (
                  <p key={e}>{e}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card text-sm text-slate-400">
          <p className="font-medium text-white">How this works</p>
          <p className="mt-2">
            Concentration = (vial mg × 1000) ÷ water ml. Volume to draw = dose mcg ÷
            concentration. On a U-100 syringe, 1&nbsp;ml = 100 units, so units =
            volume × 100.
          </p>
        </div>
      </div>
    </div>
  );
}

/** A drawn insulin syringe: graduated barrel, purple fill up to the draw mark,
 * and the plunger pulled back to that mark. */
function SyringeVisual({
  fillFraction,
  unitsPerMl,
}: {
  fillFraction: number;
  unitsPerMl: number;
}) {
  // Barrel geometry (viewBox units)
  const barrelX = 52;
  const barrelW = 300;
  const barrelY = 16;
  const barrelH = 30;
  const fillW = Math.max(0, Math.min(1, fillFraction)) * barrelW;
  const plungerX = barrelX + fillW;

  // Major ticks every 10% of the syringe, minor at 5%.
  const majors = Array.from({ length: 11 }, (_, i) => i); // 0..10

  return (
    <svg viewBox="0 0 420 74" className="w-full" role="img" aria-label={`Syringe filled to ${Math.round(fillFraction * unitsPerMl * 10) / 10} of ${unitsPerMl} units`}>
      <defs>
        <linearGradient id="syringe-fill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9a7bff" />
          <stop offset="100%" stopColor="#6a44f5" />
        </linearGradient>
      </defs>

      {/* Needle */}
      <line x1="6" y1="31" x2="38" y2="31" stroke="#475069" strokeWidth="2" />
      {/* Hub */}
      <path d="M38 25 L52 21 L52 41 L38 37 Z" fill="#1b1b28" stroke="#2c2c3d" strokeWidth="1.5" />

      {/* Barrel */}
      <rect x={barrelX} y={barrelY} width={barrelW} height={barrelH} rx="5" fill="#0b0b10" stroke="#2c2c3d" strokeWidth="1.5" />

      {/* Fill */}
      {fillW > 0 && (
        <rect x={barrelX + 1.5} y={barrelY + 2} width={Math.max(0, fillW - 3)} height={barrelH - 4} rx="3.5" fill="url(#syringe-fill)" opacity="0.9" />
      )}

      {/* Plunger seal at the draw mark + rod out the back */}
      <rect x={plungerX - 1.5} y={barrelY + 1.5} width="5" height={barrelH - 3} rx="1.5" fill="#e2e8f0" />
      <line x1={plungerX + 4} y1="31" x2="404" y2="31" stroke="#475069" strokeWidth="4" />
      <rect x="404" y="20" width="6" height="22" rx="2" fill="#475069" />

      {/* Graduations */}
      {majors.map((i) => {
        const x = barrelX + (i / 10) * barrelW;
        return (
          <g key={i}>
            <line x1={x} y1={barrelY + 1.5} x2={x} y2={barrelY + (i % 2 === 0 ? 12 : 8)} stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1" />
            {i > 0 && (
              <text x={x} y={barrelY + barrelH + 14} textAnchor="middle" fontSize="9" fill="#6b6b7b">
                {Math.round((i / 10) * unitsPerMl)}
              </text>
            )}
          </g>
        );
      })}
      {/* Minor ticks */}
      {Array.from({ length: 50 }, (_, i) => i + 1)
        .filter((i) => i % 5 !== 0)
        .map((i) => {
          const x = barrelX + (i / 50) * barrelW;
          return <line key={i} x1={x} y1={barrelY + 1.5} x2={x} y2={barrelY + 6} stroke="#ffffff" strokeOpacity="0.12" strokeWidth="0.75" />;
        })}
    </svg>
  );
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="rounded-xl border border-lab-border bg-lab-bg p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={big ? "mt-1 text-2xl font-bold text-white" : "mt-1 text-lg font-semibold text-white"}>
        {value}
      </p>
    </div>
  );
}
