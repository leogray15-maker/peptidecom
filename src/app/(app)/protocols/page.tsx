import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { articlesByCategory, LIBRARY, LIBRARY_INTRO } from "@/lib/protocols";

export const metadata = { title: "Protocols" };

export default function ProtocolsPage() {
  const groups = articlesByCategory();

  return (
    <div>
      <PageHeader
        title="Protocols"
        subtitle="The Arcane Lab healing library — step-by-step protocols, curated by the lab."
      />

      <div className="card border-gold-500/25">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-500/10 text-gold-300">
            <BookOpen className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-white">
            {LIBRARY.length} protocols · {groups.length} sections
          </p>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{LIBRARY_INTRO}</p>
        <p className="mt-3 text-xs text-slate-500">
          For research &amp; educational purposes only. Nothing here is medical advice.
        </p>
      </div>

      <div className="mt-8 space-y-8">
        {groups.map((group) => (
          <section key={group.category}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {group.category}
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {group.articles.map((a) => (
                <Link
                  key={a.slug}
                  href={`/protocols/${a.slug}`}
                  className="card group transition hover:border-brand-500/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{a.title}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{a.summary}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-brand-300" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
