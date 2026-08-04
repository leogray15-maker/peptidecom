/* How the Postgres connection string is resolved and sized.
 *
 * This runs on every cold start of every deploy, so a URL it mangles is a site
 * that doesn't come up — and the params it adds are what stop a pooled database
 * from being exhausted by its own app.
 *
 * Run: npm run test:db-url
 */
import { isPooled, resolveDatabaseUrl, shouldTune, tuneConnection } from "../src/lib/db-url";

let failures = 0;

function check(name: string, pass: boolean, detail?: string) {
  if (pass) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const params = (url: string) => new URLSearchParams(url.split("?")[1] ?? "");

// The real one from this project's Vercel config, near enough.
const SUPABASE_SESSION =
  "postgresql://postgres.abcdefgh:s3cret@aws-1-eu-west-2.pooler.supabase.com:5432/postgres";
const SUPABASE_TRANSACTION =
  "postgresql://postgres.abcdefgh:s3cret@aws-1-eu-west-2.pooler.supabase.com:6543/postgres";
const DIRECT = "postgresql://postgres:s3cret@db.abcdefgh.supabase.co:5432/postgres";
const LOCAL = "postgresql://postgres@localhost:5432/peptidecom?schema=public";

console.log("\nSpotting a pooled connection:");
{
  check("Supabase's session-mode pooler", isPooled(SUPABASE_SESSION));
  check("Supabase's transaction-mode pooler", isPooled(SUPABASE_TRANSACTION));
  check("a PgBouncer URL", isPooled("postgresql://u:p@pgbouncer.internal:5432/db"));
  check("a direct database host isn't pooled", !isPooled(DIRECT));
  check("localhost is left alone even on 6543", !shouldTune("postgresql://postgres@localhost:6543/db"));
}

console.log("\nSizing it:");
{
  const tuned = tuneConnection(SUPABASE_SESSION);
  check("a pooled URL asks for one connection", params(tuned).get("connection_limit") === "1");
  check("…and waits longer for it than the 10s default", params(tuned).get("pool_timeout") === "20");
  check(
    "…and doesn't disable prepared statements in session mode",
    params(tuned).get("pgbouncer") === null
  );

  const txn = tuneConnection(SUPABASE_TRANSACTION);
  check(
    "transaction mode disables prepared statements (they don't survive it)",
    params(txn).get("pgbouncer") === "true"
  );

  check("a direct connection is left exactly as it was", tuneConnection(DIRECT) === DIRECT);
  check("a local one is too", tuneConnection(LOCAL) === LOCAL);
}

console.log("\nNot breaking the URL it was given:");
{
  const tuned = tuneConnection(SUPABASE_SESSION);
  check(
    "credentials, host, port and database survive intact",
    tuned.startsWith(SUPABASE_SESSION),
    tuned
  );

  const withSsl = tuneConnection(`${SUPABASE_SESSION}?sslmode=require&schema=public`);
  check("existing params are kept", params(withSsl).get("sslmode") === "require");
  check("…including the schema", params(withSsl).get("schema") === "public");

  const explicit = tuneConnection(`${SUPABASE_SESSION}?connection_limit=5`);
  check(
    "an operator's own connection_limit wins — this is a default, not a policy",
    params(explicit).get("connection_limit") === "5"
  );

  check(
    "tuning twice changes nothing the second time",
    tuneConnection(tuned) === tuned,
    tuneConnection(tuned)
  );
}

console.log("\nFinding it in the environment:");
{
  check(
    "DATABASE_URL wins",
    resolveDatabaseUrl({ DATABASE_URL: "a", POSTGRES_URL: "b" }) === "a"
  );
  check(
    "the Vercel/Supabase integration vars are picked up when it's absent",
    resolveDatabaseUrl({ POSTGRES_URL_NON_POOLING: "b" }) === "b"
  );
  check("no database configured is undefined, not a crash", resolveDatabaseUrl({}) === undefined);
}

console.log(
  failures === 0 ? "\nAll connection string checks passed.\n" : `\n${failures} check(s) failed.\n`
);
process.exit(failures === 0 ? 0 : 1);
