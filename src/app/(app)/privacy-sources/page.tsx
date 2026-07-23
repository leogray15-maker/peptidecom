import Link from "next/link";
import { BookOpen, FileText, LifeBuoy, Lock, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PrivacySourcesToggles } from "@/components/privacy-sources-client";

export const metadata = { title: "Privacy & Sources" };

const sources = [
  {
    title: "EASI — Eczema Area & Severity Index",
    cite: "Hanifin JM, et al. Exp Dermatol. 2001. Severity strata: Leshem YA, et al. Br J Dermatol. 2015.",
  },
  {
    title: "POEM — Patient-Oriented Eczema Measure",
    cite: "Charman CR, Venn AJ, Williams HC. Arch Dermatol. 2004. Banding: Charman CR, et al. Br J Dermatol. 2013.",
  },
  {
    title: "Ingredient watch list",
    cite: "American Contact Dermatitis Society core-allergen series · EU Cosmetics Regulation fragrance-allergen list · National Eczema Association ingredient guidance.",
  },
  {
    title: "Photo severity estimate",
    cite: "On-device colour/erythema heuristic (no external model). An experiment that supplements — never replaces — your own rating.",
  },
];

export default function PrivacySourcesPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Privacy & Sources"
        subtitle="What happens to your data, and where our numbers come from."
      />

      <div className="space-y-6">
        {/* Posture */}
        <section className="card !rounded-3xl">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-500/15 text-brand-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-white">Processed on your device</h2>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            The skin tools here are built to keep sensitive data close. Photo grading, the EASI and
            POEM calculators and the ingredient scanner all run <span className="font-semibold text-white">in your browser</span> —
            no photos, ingredient lists or scores are sent to any third-party AI service. Your
            daily logs and photos sync privately to your own account so your timeline follows you
            between devices; nobody else can see them unless you explicitly share.
          </p>
          <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5" /> None of these tools require sending your data to an
            outside AI provider.
          </p>
        </section>

        {/* Consent toggles */}
        <section className="card !rounded-3xl">
          <h2 className="text-lg font-semibold text-white">Optional on-device features</h2>
          <p className="mt-1 text-sm text-slate-400">
            All on by default. You can switch any of them off — the choice is saved on this device.
          </p>
          <div className="mt-5">
            <PrivacySourcesToggles />
          </div>
        </section>

        {/* Policies */}
        <section className="card !rounded-3xl">
          <h2 className="text-lg font-semibold text-white">Policies</h2>
          <div className="mt-4 space-y-1">
            <Link href="/legal/privacy" className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-brand-300 transition hover:bg-white/5 hover:text-brand-200">
              <FileText className="h-4 w-4" /> Privacy Policy
            </Link>
            <Link href="/legal/disclaimer" className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-brand-300 transition hover:bg-white/5 hover:text-brand-200">
              <FileText className="h-4 w-4" /> Medical disclaimer
            </Link>
            <Link href="/support" className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-brand-300 transition hover:bg-white/5 hover:text-brand-200">
              <LifeBuoy className="h-4 w-4" /> Support
            </Link>
          </div>
        </section>

        {/* Sources */}
        <section className="card !rounded-3xl">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-500/15 text-brand-300">
              <BookOpen className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-white">Sources &amp; citations</h2>
          </div>
          <ul className="mt-4 space-y-4">
            {sources.map((s) => (
              <li key={s.title} className="border-b border-lab-border pb-4 last:border-0 last:pb-0">
                <p className="text-sm font-medium text-white">{s.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{s.cite}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            These scores are validated clinical measures used here as educational self-tracking
            tools. They help you see change and start a conversation with a clinician — they are
            not a diagnosis and don&apos;t replace medical care.
          </p>
        </section>
      </div>
    </div>
  );
}
