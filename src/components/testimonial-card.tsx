import { Quote, ShieldCheck } from "lucide-react";
import { conditionLabel } from "@/lib/conditions";
import type { PublicTestimonial } from "@/lib/testimonials";
import { TestimonialGallery } from "@/components/testimonial-media";
import { cn } from "@/lib/utils";

/** Attribution line shared by both variants — first name, what they were
 * dealing with, and how long it took. */
function Attribution({ t }: { t: PublicTestimonial }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className="font-semibold text-brand-200">— {t.name}</span>
      <span className="badge border border-lab-border text-slate-400">
        {conditionLabel(t.condition)}
      </span>
      {t.timeframe && <span className="text-slate-500">{t.timeframe}</span>}
    </div>
  );
}

/** Full testimonial: their words, their photos, their attribution. */
export function TestimonialCard({
  testimonial: t,
  className,
  featured = false,
}: {
  testimonial: PublicTestimonial;
  className?: string;
  featured?: boolean;
}) {
  return (
    <article
      className={cn(
        "card flex flex-col gap-5",
        featured && "border-brand-700/60 bg-gradient-to-br from-brand-950/40 to-lab-card",
        className
      )}
    >
      <div>
        <Quote className="h-6 w-6 text-brand-400" aria-hidden />
        <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-slate-200">
          {t.quote}
        </p>
      </div>

      <TestimonialGallery images={t.images} columns={t.images.length <= 2 ? 2 : 3} />

      <div className="mt-auto space-y-2">
        <Attribution t={t} />
        <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          {t.source === "member"
            ? "Member story, published with their permission"
            : "Real message and photos, published with permission"}
        </p>
      </div>
    </article>
  );
}

/** Compact pull-quote for proof strips — one line, no photos. */
export function TestimonialQuote({ testimonial: t }: { testimonial: PublicTestimonial }) {
  return (
    <figure className="card h-full">
      <Quote className="h-4 w-4 text-brand-400" aria-hidden />
      <blockquote className="mt-2.5 text-sm leading-relaxed text-slate-200">
        &ldquo;{t.highlight}&rdquo;
      </blockquote>
      <figcaption className="mt-3">
        <Attribution t={t} />
      </figcaption>
    </figure>
  );
}
