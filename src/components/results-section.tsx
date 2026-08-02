import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { TestimonialCard, TestimonialQuote } from "@/components/testimonial-card";
import { getPublicTestimonials } from "@/lib/public-testimonials";

/** Social proof on the landing page: one story told in full, the rest as pull
 * quotes. Reads the same wall as /results, so featuring a member story in the
 * admin puts it here too. */
export async function ResultsSection() {
  const testimonials = await getPublicTestimonials(6);
  if (testimonials.length === 0) return null;

  const [lead, ...rest] = testimonials;

  return (
    <section id="results" className="border-t border-lab-border py-24">
      <div className="container-lab">
        <div className="mx-auto max-w-2xl text-center">
          <span className="badge border border-gold-500/40 bg-gold-500/10 text-gold-300">
            <Sparkles className="h-3.5 w-3.5" /> Real members, real photos
          </span>
          <h2 className="mt-6 text-3xl font-bold text-white">Skin that actually got better</h2>
          <p className="mt-4 leading-relaxed text-slate-400">
            Nothing here is stock copy. These are members&apos; own words and their own
            before-and-afters, published with their permission — and every one of them started
            with someone in the worst week of it.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
          <TestimonialCard testimonial={lead} featured />

          <div className="flex flex-col gap-6">
            {rest.slice(0, 2).map((t) => (
              <TestimonialQuote key={t.id} testimonial={t} />
            ))}

            <div className="card flex flex-1 flex-col justify-center bg-gradient-to-br from-brand-900/50 to-lab-card">
              <h3 className="text-lg font-semibold text-white">
                Your before-and-after belongs here too
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                Members post their progress to the Won wall inside the lab — photos, timeline,
                what actually worked. Sharing any of it publicly is always their call.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/pricing" className="btn-primary">
                  Join the lab <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/results" className="btn-secondary">
                  See every result
                </Link>
              </div>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-slate-500">
          Individual experiences — not typical results, not a treatment claim, and not medical
          advice. Skin conditions vary enormously; what worked for one member may do nothing for
          you.
        </p>
      </div>
    </section>
  );
}

/** Compact three-across proof strip for the pricing page. */
export async function ProofStrip() {
  const testimonials = await getPublicTestimonials(3);
  if (testimonials.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {testimonials.slice(0, 3).map((t) => (
        <TestimonialQuote key={t.id} testimonial={t} />
      ))}
    </div>
  );
}
