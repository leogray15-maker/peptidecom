"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Phone-only sticky join bar for the landing page. It stays hidden over the
 * hero — where the primary CTA is already on screen — and slides up once the
 * visitor has scrolled past it, so the offer never scrolls out of reach on a
 * long page.
 */
export function StickyJoinCta({ label }: { label: string }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 760);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-lab-border bg-lab-bg/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform duration-300 sm:hidden ${
        shown ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!shown}
    >
      <Link href="/pricing" className="btn-primary w-full py-3 text-base" tabIndex={shown ? 0 : -1}>
        {label} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
