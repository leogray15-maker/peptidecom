import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { getArticle, LIBRARY } from "@/lib/protocols";

export function generateStaticParams() {
  return LIBRARY.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  return { title: article ? article.title : "Protocol" };
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
    <div className="mx-auto max-w-2xl">
      <Link
        href="/protocols"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" /> All protocols
      </Link>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">
          {article.category}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-white">{article.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{article.summary}</p>
      </div>

      <article className="card mt-6">
        <Markdown content={article.body} />
      </article>

      <p className="mt-4 rounded-xl border border-lab-border bg-lab-card/50 p-3 text-xs text-slate-500">
        For research &amp; educational purposes only. Nothing here is medical advice. Products
        discussed are not for human consumption.
      </p>

      <nav className="mt-6 grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link href={`/protocols/${prev.slug}`} className="card group">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <ArrowLeft className="h-3.5 w-3.5" /> Previous
            </span>
            <p className="mt-1 font-medium text-white group-hover:text-brand-200">{prev.title}</p>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/protocols/${next.slug}`} className="card group text-right">
            <span className="flex items-center justify-end gap-1.5 text-xs text-slate-500">
              Next <ArrowRight className="h-3.5 w-3.5" />
            </span>
            <p className="mt-1 font-medium text-white group-hover:text-brand-200">{next.title}</p>
          </Link>
        )}
      </nav>
    </div>
  );
}
