import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TestimonialCard } from "@/components/testimonial-card";
import { getPublicTestimonials } from "@/lib/public-testimonials";

export const metadata = {
  title: "Results — member stories & before/afters",
  description:
    "Real member recovery stories and before-and-after progress photos, published with permission.",
};

// Featured member stories are read per-request, and the header reflects auth.
export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const testimonials = await getPublicTestimonials(24);

  return (
    <>
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-lab-border">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(212,175,55,0.14),transparent)]" />
        <div className="container-lab py-20 text-center">
          <span className="badge border border-gold-500/40 bg-gold-500/10 text-gold-300">
            <Sparkles className="h-3.5 w-3.5" /> Published with permission
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            The wall of what got better
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
            Members&apos; own words and their own photos. No stock models, no rewrites — the
            messages are printed as they were sent, and nothing appears here unless the person
            said yes to it.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/pricing" className="btn-primary px-6 py-3 text-base">
              Join the lab <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/won" className="btn-secondary px-6 py-3 text-base">
              Members: share yours
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-lab">
          {testimonials.length === 0 ? (
            <div className="card mx-auto max-w-xl py-14 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-gold-400" />
              <p className="mt-4 font-semibold text-white">The wall is being built.</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
                Member stories appear here once they&apos;ve been shared and cleared for
                publication. Inside the lab, the Won wall is already full of them.
              </p>
            </div>
          ) : (
            <div className="grid items-start gap-6 lg:grid-cols-2">
              {testimonials.map((t, i) => (
                <TestimonialCard key={t.id} testimonial={t} featured={i === 0} />
              ))}
            </div>
          )}

          <div className="card mt-10 flex flex-col items-start gap-4 border-brand-800/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
                Every story here is published with the member&apos;s explicit permission, and
                photos only ever appear when they ticked that box separately. Anyone can withdraw
                at any time and their story comes down.
              </p>
            </div>
            <Link href="/pricing" className="btn-primary shrink-0">
              Start your record <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-slate-500">
            These are individual experiences shared by members — not typical results, not a
            promise of an outcome, and not medical advice. Arcane Track sells nothing but
            membership: no products are being advertised on this page. Talk to a qualified
            professional about your own treatment.
          </p>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
