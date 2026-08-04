/** Working out what connection string to hand Prisma, and how to size it.
 *
 * Pure string handling, kept apart from `lib/prisma` so it can be tested
 * without constructing a client — this runs on every cold start of every
 * deploy, and a URL it mangles is a site that doesn't come up.
 */

/** Resolve the Postgres connection string from the common env var names.
 * Supports a plain DATABASE_URL as well as the POSTGRES_* vars that the
 * Supabase/Vercel Postgres integrations inject automatically. */
export function resolveDatabaseUrl(
  env: Record<string, string | undefined> = process.env
): string | undefined {
  return (
    env.DATABASE_URL ||
    env.POSTGRES_URL_NON_POOLING ||
    env.POSTGRES_PRISMA_URL ||
    env.POSTGRES_URL ||
    undefined
  );
}

/** Is this connection string pointed at a connection pooler rather than at
 * Postgres itself? Supabase's Supavisor (`*.pooler.supabase.com`), PgBouncer
 * and Vercel's pooled URLs all multiplex a small, fixed number of real
 * Postgres sessions between everyone connecting. */
export function isPooled(url: string): boolean {
  return /pooler\.|pgbouncer|:6543(?:[/?]|$)/i.test(url);
}

/** Transaction-mode pooling (Supabase's port 6543) hands a different backend to
 * every statement, so a prepared statement created on one is gone on the next —
 * Prisma's cached ones then fail with `prepared statement "s0" already exists`
 * on a *reused* connection while a cold one works fine. `pgbouncer=true` turns
 * that caching off, which is the difference between "works when I load it" and
 * "works". */
function isTransactionPooled(url: string): boolean {
  return /:6543(?:[/?]|$)/.test(url);
}

/** A local database has no pool worth husbanding, and shrinking it there just
 * makes development slower. */
function isLocal(url: string): boolean {
  return /@(localhost|127\.0\.0\.1|\[::1\])[:/]/i.test(url);
}

/** Add query params without disturbing any the operator already set — an
 * explicit `?connection_limit=5` in the env var always wins. */
function withParams(url: string, params: Record<string, string>): string {
  const [base, query = ""] = url.split("?");
  const search = new URLSearchParams(query);
  for (const [key, value] of Object.entries(params)) {
    if (!search.has(key)) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

/** Should the app treat this connection as pooled — i.e. as a shared resource
 * it has to be frugal with? */
export function shouldTune(url: string): boolean {
  return isPooled(url) && !isLocal(url);
}

/** Size the connection for the environment it's actually running in.
 *
 * Serverless inverts the usual arithmetic: instead of one long-lived process
 * holding a pool, there are as many pools as there are warm lambdas, all
 * drawing on the same handful of Postgres sessions. Prisma's default
 * (`num_cpus * 2 + 1`) per instance exhausts a pooler quickly, and the pooler's
 * answer — "max clients reached in session mode" — arrives as a *connection*
 * failure. Every query on a page fails at once, so the CRM reads it as "the
 * database is gone" and prints a wall of zeros, while a quieter page loading a
 * second later gets a slot and looks perfectly healthy.
 *
 * One connection per instance is the standard serverless shape: queries on a
 * single request queue behind each other (they were competing for one pool
 * anyway) and the number of instances, not the number of queries per page,
 * decides how much of the pool gets used. */
export function tuneConnection(url: string): string {
  if (!shouldTune(url)) return url;
  return withParams(url, {
    connection_limit: "1",
    // Default is 10s. With one connection a page's queries are serialised, so a
    // slow first query shouldn't fail the rest of the page queued behind it.
    pool_timeout: "20",
    connect_timeout: "10",
    ...(isTransactionPooled(url) ? { pgbouncer: "true" } : {}),
  });
}
