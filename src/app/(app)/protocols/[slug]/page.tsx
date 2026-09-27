import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProtocolReader } from "@/components/protocols/protocol-reader";
import { getArticle, LIBRARY } from "@/lib/protocols";
import { sentenceCase } from "@/lib/utils";

export function generateStaticParams() {
  return LIBRARY.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  return { title: article ? sentenceCase(article.title) : "Protocol" };
}

export default async function ProtocolArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const index = LIBRARY.findIndex((a) => a.slug === slug);
  const prev = index > 0 ? LIBRARY[index - 1] : null;
  const next = index < LIBRARY.length - 1 ? LIBRARY[index + 1] : null;

  return (
    <div className="mx-auto max-w-[680px]">
      <Link
        href="/protocols"
        className="-ml-1 inline-flex min-h-9 items-center gap-1.5 rounded-nav px-1 text-[13px] font-medium text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> All protocols
      </Link>

      <header className="mb-6 mt-3">
        <p className="eyebrow">{article.category}</p>
        <h1 className="mt-2 font-display text-[34px] leading-[1.08] text-fg sm:text-[44px]">
          {sentenceCase(article.title)}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-fg-secondary">{article.summary}</p>
      </header>

      <ProtocolReader slug={article.slug} body={article.body} />

      <p className="mt-4 text-meta text-fg-muted">
        For research &amp; educational purposes only. Nothing here is medical advice. Products
        discussed are not for human consumption.
      </p>

      <nav aria-label="More protocols" className="mt-6 grid gap-4 sm:grid-cols-2">
        {prev ? (
          <Link href={`/protocols/${prev.slug}`} className="card group !p-5 transition-colors hover:border-line-strong">
            <span className="flex items-center gap-1.5 text-meta text-fg-muted">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Previous
            </span>
            <p className="mt-1 text-sm font-medium text-fg">{sentenceCase(prev.title)}</p>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/protocols/${next.slug}`} className="card group !p-5 text-right transition-colors hover:border-line-strong">
            <span className="flex items-center justify-end gap-1.5 text-meta text-fg-muted">
              Next <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </span>
            <p className="mt-1 text-sm font-medium text-fg">{sentenceCase(next.title)}</p>
          </Link>
        )}
      </nav>
    </div>
  );
}
