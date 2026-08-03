import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

/** Shown when the CRM can't reach Postgres. Without it the page renders a
 * confident wall of zeros, which reads as "we have no members" rather than
 * "we can't see our members" — the two need very different reactions. */
export function DbWarning() {
  return (
    <div className="card mb-4 border-red-500/40 bg-red-500/5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
        <div className="min-w-0">
          <h2 className="font-semibold text-white">Database not reachable</h2>
          <p className="mt-1 text-sm text-slate-300">
            Every figure below is a placeholder, not a real count — the CRM can&apos;t read
            Postgres, so it can&apos;t tell an empty table from a missing connection. Sign-in is
            down for the same reason: new members can&apos;t be created without the database.
          </p>
          <Link
            href="/setup"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-red-300 hover:text-red-200"
          >
            Check DATABASE_URL on /setup <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
