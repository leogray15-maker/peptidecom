import { ProtocolsBrowser } from "@/components/protocols/protocols-browser";
import { LIBRARY, LIBRARY_CATEGORIES, LIBRARY_INTRO } from "@/lib/protocols";
import { sentenceCase } from "@/lib/utils";

export const metadata = { title: "Protocols" };

export default function ProtocolsPage() {
  const categories = LIBRARY_CATEGORIES.filter((c) => LIBRARY.some((a) => a.category === c));

  return (
    <ProtocolsBrowser
      categories={[...categories]}
      protocols={LIBRARY.map((a) => ({
        slug: a.slug,
        title: sentenceCase(a.title),
        category: a.category,
        summary: a.summary,
      }))}
      intro={
      <section className="card mb-6 !py-4" aria-label="About the protocols">
        <p className="font-mono text-meta tabular-nums text-fg">
          {LIBRARY.length} protocols · {categories.length} sections
        </p>
        <p className="mt-1.5 max-w-3xl text-[13.5px] leading-relaxed text-fg-secondary">{LIBRARY_INTRO}</p>
        <p className="mt-2 text-meta text-fg-muted">
          For research &amp; educational purposes only. Nothing here is medical advice.
        </p>
      </section>
      }
    />
  );
}
