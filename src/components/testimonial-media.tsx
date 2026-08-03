"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageOff, X } from "lucide-react";
import type { TestimonialImage } from "@/lib/testimonials";
import { cn } from "@/lib/utils";

/** A single testimonial image.
 *
 * Curated testimonials point at files under /public, which may not have been
 * dropped in yet — a 404 must never render as a broken-image icon on the sales
 * page, so the tile degrades to a labelled placeholder instead. Photos uploaded
 * through the admin proof wall are data-URLs and always resolve. */
function Tile({
  image,
  failed,
  onFail,
  onOpen,
}: {
  image: TestimonialImage;
  failed: boolean;
  onFail: () => void;
  onOpen: () => void;
}) {
  const screenshot = image.kind === "screenshot";

  if (failed) {
    return (
      <figure className="flex flex-col overflow-hidden rounded-xl border border-dashed border-lab-border bg-lab-bg">
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <ImageOff className="h-5 w-5 text-slate-600" />
          <span className="text-[11px] leading-relaxed text-slate-500">
            {image.caption ?? "Photo unavailable"}
          </span>
        </div>
      </figure>
    );
  }

  return (
    <figure className="overflow-hidden rounded-xl border border-lab-border bg-lab-bg">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        aria-label={`View larger: ${image.alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          alt={image.alt}
          loading="lazy"
          onError={onFail}
          className={cn(
            "w-full",
            screenshot ? "object-contain" : "aspect-square object-cover"
          )}
        />
      </button>
      {image.caption && (
        <figcaption className="px-3 py-2 text-[11px] text-slate-500">{image.caption}</figcaption>
      )}
    </figure>
  );
}

function Lightbox({ image, onClose }: { image: TestimonialImage; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Stop the page behind the overlay from scrolling under it.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full border border-lab-border bg-lab-card p-2 text-slate-300 hover:text-white"
      >
        <X className="h-5 w-5" />
      </button>
      <figure onClick={(e) => e.stopPropagation()} className="max-h-full w-full max-w-3xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          alt={image.alt}
          className="mx-auto max-h-[80vh] w-auto max-w-full rounded-xl"
        />
        {image.caption && (
          <figcaption className="mt-3 text-center text-sm text-slate-400">{image.caption}</figcaption>
        )}
      </figure>
    </div>
  );
}

/** Grid of a testimonial's photos, click-to-zoom.
 *
 * A grid where *every* image failed is worse than no grid at all — it reads as
 * a broken page rather than as proof. So when nothing resolved, the gallery
 * removes itself and the quote carries the card on its own. A partial failure
 * still shows its labelled placeholders, because the photos that did load are
 * worth keeping in context. */
export function TestimonialGallery({
  images,
  className,
  columns = 3,
}: {
  images: TestimonialImage[];
  className?: string;
  columns?: 2 | 3;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [failed, setFailed] = useState<ReadonlySet<number>>(() => new Set());
  const close = useCallback(() => setOpenIndex(null), []);

  const markFailed = useCallback((index: number) => {
    setFailed((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));
  }, []);

  if (images.length === 0 || failed.size === images.length) return null;

  return (
    <>
      <div
        className={cn(
          "grid gap-3",
          columns === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3",
          className
        )}
      >
        {images.map((image, i) => (
          <Tile
            key={image.src.slice(0, 64) + i}
            image={image}
            failed={failed.has(i)}
            onFail={() => markFailed(i)}
            onOpen={() => setOpenIndex(i)}
          />
        ))}
      </div>
      {openIndex !== null && images[openIndex] && !failed.has(openIndex) && (
        <Lightbox image={images[openIndex]} onClose={close} />
      )}
    </>
  );
}
