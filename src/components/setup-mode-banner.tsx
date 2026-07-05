import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { isPreviewMode } from "@/lib/auth";
import { isAdminConfigured } from "@/lib/firebase-admin";

/** Shown while the site is in setup mode (Firebase admin not configured yet):
 * offers a one-click way into the dashboard without logging in. */
export function SetupModeBanner() {
  // Only show the shortcut when it's genuinely unlocked (auth not yet enforced).
  if (!isPreviewMode() || isAdminConfigured()) return null;
  return (
    <div className="mb-4 rounded-xl border border-brand-700 bg-brand-950/50 p-4 text-sm text-brand-100">
      <p className="font-semibold text-white">Setup mode</p>
      <p className="mt-1 text-brand-200">
        Auth isn&apos;t configured yet, so you can preview the app without logging in.
      </p>
      <Link href="/dashboard" className="btn-primary mt-3 w-full">
        Enter dashboard <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
