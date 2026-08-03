// Push the Prisma schema to the database during the Vercel build, so the
// tables always exist in production without anyone running a CLI by hand.
//
// Two things this has to survive, because a build is not a good place to be
// fragile:
//
//  1. **The pooler.** The app talks to Postgres through a connection pooler
//     (Supabase's Supavisor, PgBouncer, Vercel's own), which is right for
//     serverless request handling and wrong for a schema push — the schema
//     engine wants its own session, and a pooler in session mode hands out a
//     fixed number of those. So the push prefers a direct, non-pooled URL when
//     one is configured, and only falls back to the pooled one.
//  2. **A full pool.** "max clients reached in session mode" is a statement
//     about how busy the pooler is this second, not about the schema. It's
//     retried, and if it still won't let us in, the build carries on: refusing
//     to deploy because a pooler was momentarily full would mean the site sits
//     on a stale build over something that will have cleared by the time
//     anyone looks. Every other failure — a schema conflict, bad credentials —
//     still fails the build, because those don't fix themselves.
import { spawnSync } from "node:child_process";

/** The schema push wants a session it can hold. `DIRECT_URL` and
 * `POSTGRES_URL_NON_POOLING` are the two names hosts use for that; the pooled
 * URL is the fallback, not the preference. */
const url =
  process.env.DIRECT_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;

if (!url) {
  console.log("[db-push] No database URL set — skipping schema push.");
  process.exit(0);
}

const pooled = !(process.env.DIRECT_URL || process.env.POSTGRES_URL_NON_POOLING);

/** One connection is all a schema push needs, and asking for one is the
 * difference between fitting in a busy pool and being turned away. */
function withSingleConnection(connectionString) {
  if (/[?&]connection_limit=/.test(connectionString)) return connectionString;
  return connectionString + (connectionString.includes("?") ? "&" : "?") + "connection_limit=1";
}

/** Is this the pooler saying "not right now", rather than the database saying
 * "no"? Only these are worth retrying, and only these are survivable. */
function isCapacityError(output) {
  return /EMAXCONNSESSION|max clients reached|too many clients|too many connections|remaining connection slots/i.test(
    output
  );
}

const ATTEMPTS = 4;
const pushUrl = withSingleConnection(url);

console.log(
  `[db-push] Pushing Prisma schema to the database… (${pooled ? "pooled" : "direct"} connection)`
);

let lastOutput = "";
for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  const res = spawnSync(
    "npx",
    ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"],
    { encoding: "utf8", env: { ...process.env, DATABASE_URL: pushUrl } }
  );

  // Piped rather than inherited so the failure can be classified — the output
  // still goes to the build log either way.
  lastOutput = `${res.stdout ?? ""}${res.stderr ?? ""}`;
  process.stdout.write(res.stdout ?? "");
  process.stderr.write(res.stderr ?? "");

  if (res.status === 0) {
    console.log("[db-push] Schema is up to date.");
    process.exit(0);
  }

  if (!isCapacityError(lastOutput)) {
    console.error("[db-push] prisma db push failed — see output above.");
    process.exit(res.status ?? 1);
  }

  if (attempt < ATTEMPTS) {
    const waitMs = 2000 * 2 ** (attempt - 1);
    console.warn(
      `[db-push] Connection pool is full (attempt ${attempt}/${ATTEMPTS}) — retrying in ${waitMs / 1000}s.`
    );
    // Synchronous on purpose: nothing else should start until this settles.
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, waitMs);
  }
}

console.warn(
  "[db-push] Could not get a connection after " +
    `${ATTEMPTS} attempts — the pool stayed full. Continuing the build with the ` +
    "schema unchanged."
);
if (pooled) {
  console.warn(
    "[db-push] This push went through a connection pooler. Setting DIRECT_URL to " +
      "the database's non-pooled connection string would give the schema engine its " +
      "own session and stop this happening."
  );
}
process.exit(0);
