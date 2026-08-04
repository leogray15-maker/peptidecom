/* How a failed database call is read, and what `safe()` does about it.
 *
 * The bug this guards: a full connection pool and a missing DATABASE_URL both
 * end as an empty page, so the CRM printed the same "database not reachable"
 * wall of zeros for a database that was up, had data, and was simply busy for
 * one second. Getting the classification wrong in either direction is costly —
 * retrying a wrong password wastes the pool it's competing for, and giving up
 * on a busy one publishes placeholder figures as if they were counts.
 *
 * The message strings below are real ones, captured from Postgres and Prisma
 * rather than written from memory.
 *
 * Run: npm run test:db-errors
 */
import { type DbTroubleKind, describeDbError, safe } from "../src/lib/safe-db";

let failures = 0;

function check(name: string, pass: boolean, detail?: string) {
  if (pass) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

/** Prisma wraps its causes in a preamble and, sometimes, a code frame. */
function prismaError(cause: string, code?: string): Error {
  const err = new Error(`\nInvalid \`prisma.user.count()\` invocation:\n\n\n${cause}`);
  if (code) (err as Error & { code: string }).code = code;
  return err;
}

function classify(cause: string, code?: string) {
  return describeDbError(prismaError(cause, code));
}

// A DATABASE_URL has to look configured or everything reads as "unconfigured".
process.env.DATABASE_URL ||= "postgresql://user:pw@localhost:5432/db";

console.log("\nClassifying real failures:");
{
  const cases: [string, string, DbTroubleKind, boolean][] = [
    // cause, description, expected kind, expected transient
    [
      "Too many database connections opened: FATAL: sorry, too many clients already",
      "Postgres out of connection slots",
      "capacity",
      true,
    ],
    [
      "Error querying the database: db error: ERROR: (EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15",
      "Supabase pooler full (the error that killed a deploy)",
      "capacity",
      true,
    ],
    [
      "Timed out fetching a new connection from the connection pool.",
      "Prisma's own pool starved",
      "capacity",
      true,
    ],
    ["Can't reach database server at `localhost:5999`", "nothing listening", "unreachable", true],
    [
      'prepared statement "s0" already exists',
      "transaction-mode pooler recycling a connection",
      "unreachable",
      true,
    ],
    [
      "Database `peptidecom` does not exist",
      "wrong database name — retrying won't help",
      "unreachable",
      false,
    ],
    [
      "User was denied access on the database `(not available)`",
      "bad credentials — retrying won't help",
      "unreachable",
      false,
    ],
    [
      'Raw query failed. Code: `42P01`. Message: `relation "User" does not exist`',
      "schema never pushed",
      "schema",
      false,
    ],
  ];

  for (const [cause, description, kind, transient] of cases) {
    const got = classify(cause);
    check(
      `${description} → ${kind}${transient ? " (retry)" : " (don't retry)"}`,
      got.kind === kind && got.transient === transient,
      `got ${got.kind}, transient=${got.transient}`
    );
  }
}

console.log("\nWhat the admin is shown:");
{
  const got = classify("Can't reach database server at `localhost:5999`");
  check(
    "the cause is reported, not Prisma's 'Invalid invocation' preamble",
    got.message === "Can't reach database server at `localhost:5999`",
    got.message
  );

  const leaky = describeDbError(
    new Error("Can't reach database server at postgresql://admin:hunter2@db.example.com:5432/prod")
  );
  check(
    "a connection string in the message loses its credentials",
    !leaky.message.includes("hunter2") && leaky.message.includes("***"),
    leaky.message
  );

  const framed = describeDbError(
    new Error(
      "\nInvalid `prisma.user.count()` invocation in\n/app/src/page.tsx:23:14\n\n  21 const url = process.env.DATABASE_URL\n→ 23 await prisma.user.count(\nDatabase `nope` does not exist"
    )
  );
  check(
    "a code frame isn't quoted back (it can carry anything on those lines)",
    framed.message === "Database `nope` does not exist",
    framed.message
  );
}

console.log("\nWhat safe() does with them:");

async function main() {
  {
    let attempts = 0;
    const started = Date.now();
    const value = await safe(async () => {
      attempts++;
      throw prismaError("Too many database connections opened: FATAL: sorry, too many clients already");
    }, "fallback");
    check("a busy pool is retried before the fallback is taken", attempts === 3, `${attempts} attempts`);
    check("the fallback is still returned once retries run out", value === "fallback");
    check("retries back off rather than hammering", Date.now() - started >= 400);
  }

  {
    let attempts = 0;
    const value = await safe(async () => {
      attempts++;
      if (attempts === 1) {
        throw prismaError("Timed out fetching a new connection from the connection pool.");
      }
      return "real data";
    }, "fallback");
    check(
      "a query that recovers returns real data, not the placeholder",
      value === "real data" && attempts === 2,
      `${value} after ${attempts} attempts`
    );
  }

  {
    let attempts = 0;
    await safe(async () => {
      attempts++;
      throw prismaError('Raw query failed. Code: `42P01`. Message: `relation "User" does not exist`');
    }, null);
    check("a missing table isn't retried — it won't fix itself", attempts === 1, `${attempts} attempts`);
  }

  {
    const value = await safe(async () => "fine", "fallback");
    check("a working query is left alone", value === "fine");
  }

  console.log(
    failures === 0 ? "\nAll database error checks passed.\n" : `\n${failures} check(s) failed.\n`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main();
