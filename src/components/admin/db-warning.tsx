import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { DbTrouble } from "@/lib/safe-db";

/** Shown when the CRM couldn't read Postgres. Without it the page renders a
 * confident wall of zeros, which reads as "we have no members" rather than
 * "we can't see our members" — the two need very different reactions.
 *
 * Which of those it is matters too, so the copy follows the actual failure. A
 * full connection pool clears by itself and wants a reload; a missing
 * DATABASE_URL wants someone in the Vercel dashboard. Telling an owner to go
 * and check their env vars over a pooler that was busy for one second is how
 * a warning stops being believed. */
const COPY: Record<
  DbTrouble["kind"],
  { title: string; body: string; fix: { label: string; href: string } | null }
> = {
  unconfigured: {
    title: "No database configured",
    body: "Every figure below is a placeholder — this deploy has no DATABASE_URL, so the CRM has nothing to read. Sign-in is down for the same reason: new members can't be created without the database.",
    fix: { label: "Check DATABASE_URL on /setup", href: "/setup" },
  },
  capacity: {
    title: "Database busy — figures below aren't real",
    body: "Postgres turned the CRM away because its connection pool is full, so every number here is a placeholder rather than a count. This normally clears within seconds; reload the page. If it keeps happening, the pool is too small for the traffic.",
    fix: { label: "See the connection on /setup", href: "/setup" },
  },
  unreachable: {
    title: "Database not reachable",
    body: "Every figure below is a placeholder, not a real count — the CRM can't read Postgres, so it can't tell an empty table from a missing connection. Sign-in is down for the same reason: new members can't be created without the database.",
    fix: { label: "Check DATABASE_URL on /setup", href: "/setup" },
  },
  schema: {
    title: "Database connected, tables missing",
    body: "The CRM reached Postgres but the tables aren't there, so everything below reads as empty. The schema push hasn't run against this database yet.",
    fix: { label: "Check the schema on /setup", href: "/setup" },
  },
  unknown: {
    title: "Couldn't read the database",
    body: "Every figure below is a placeholder rather than a real count — a query failed and the CRM fell back to empty results.",
    fix: { label: "Run the diagnostics on /setup", href: "/setup" },
  },
};

export function DbWarning({ trouble }: { trouble: DbTrouble }) {
  const copy = COPY[trouble.kind] ?? COPY.unknown;

  return (
    <div className="card mb-4 border-red-500/40 bg-red-500/5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
        <div className="min-w-0">
          <h2 className="font-semibold text-white">{copy.title}</h2>
          <p className="mt-1 text-sm text-slate-300">{copy.body}</p>
          {trouble.message && (
            <p className="mt-2 break-words font-mono text-xs text-red-300/80">{trouble.message}</p>
          )}
          {copy.fix && (
            <Link
              href={copy.fix.href}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-red-300 hover:text-red-200"
            >
              {copy.fix.label} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
