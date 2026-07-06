import { ArrowRight, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Protocols" };

export default function ProtocolsPage() {
  // Set NEXT_PUBLIC_PROTOCOLS_URL (e.g. a public Notion page) to link the library.
  const url = process.env.NEXT_PUBLIC_PROTOCOLS_URL ?? null;

  return (
    <div>
      <PageHeader
        title="Protocols"
        subtitle="Mini courses and step-by-step protocols, curated by the lab."
      />

      <div className="card flex flex-col items-center py-16 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-900/60 text-brand-300">
          <GraduationCap className="h-7 w-7" />
        </div>
        {url ? (
          <>
            <p className="mt-5 text-lg font-semibold text-white">The protocol library is open.</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              Courses and protocols live in the library — new material is added regularly.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-6"
            >
              Open the protocol library <ArrowRight className="h-4 w-4" />
            </a>
          </>
        ) : (
          <>
            <p className="mt-5 text-lg font-semibold text-white">Protocols are coming soon.</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              Mini courses and step-by-step protocols are being prepared. They&apos;ll appear here
              the moment they&apos;re ready.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
