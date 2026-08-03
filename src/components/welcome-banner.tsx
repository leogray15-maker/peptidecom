"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PartyPopper, X } from "lucide-react";

/**
 * The thank-you a new member sees the first time they land on the dashboard
 * after paying. Rendered only when the post-checkout redirect carries
 * `?welcome=1`, and the parameter is cleaned off the URL straight away so a
 * refresh or a shared link doesn't show it again.
 */
export function WelcomeBanner({ name }: { name?: string | null }) {
  const [open, setOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  if (!open) return null;

  return (
    <div
      role="status"
      className="mb-5 flex items-start gap-3 rounded-2xl border border-brand-500/40 bg-brand-500/10 p-4"
    >
      <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-brand-300" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-white">
          {name ? `Thank you, ${name} — you're in.` : "Thank you — you're in."}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-brand-100/80">
          Your membership is active and every tool is unlocked. A receipt is on its way to
          your inbox. The best first step is logging today in the tracker.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Dismiss"
        className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
