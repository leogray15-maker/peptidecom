import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <div className="container-lab py-16">
        <article className="prose-invert mx-auto max-w-3xl space-y-4 text-slate-300 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-white [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white">
          {children}
        </article>
      </div>
      <SiteFooter />
    </>
  );
}
