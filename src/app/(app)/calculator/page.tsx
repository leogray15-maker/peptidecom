import { PageHeader } from "@/components/page-header";
import { CalculatorClient } from "@/components/calculator-client";

export const metadata = { title: "Reconstitution calculator" };

export default async function CalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  return (
    <div>
      <PageHeader
        title="Reconstitution calculator"
        subtitle="Work out exactly how much to draw into an insulin syringe."
      />
      <CalculatorClient initialSlug={p} />
      <p className="mt-6 text-xs text-slate-500">
        Educational tool for research purposes only. Not medical advice. Always
        verify your own maths and consult qualified professionals.
      </p>
    </div>
  );
}
