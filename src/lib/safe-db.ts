import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** How a database call failed, in the terms that decide what to do about it.
 *
 * The distinction that matters most is `transient`. A pooler answering "max
 * clients reached" and a database that doesn't exist produce the same empty
 * page, but the first clears on its own in a second and the second needs
 * someone to go and fix an env var. */
export type DbTroubleKind =
  | "unconfigured"
  | "capacity"
  | "unreachable"
  | "schema"
  | "unknown";

export interface DbTrouble {
  kind: DbTroubleKind;
  /** Worth trying again — the database didn't say "no", it said "not now". */
  transient: boolean;
  /** One line, safe to show an admin: credentials are stripped out. */
  message: string;
}

const DB_URL_CONFIGURED = () =>
  !!process.env.DATABASE_URL ||
  !!process.env.POSTGRES_URL_NON_POOLING ||
  !!process.env.POSTGRES_PRISMA_URL ||
  !!process.env.POSTGRES_URL;

/** Never let a connection string reach a page. Prisma quotes the URL in some
 * errors, and an admin screen is still a screen someone can be shoulder-surfing
 * or screenshotting into a bug report. */
function redact(message: string): string {
  return message
    .replace(/(postgres(?:ql)?:\/\/)[^@\s"'`]*@/gi, "$1***@")
    .replace(/(password=)[^&\s"'`]+/gi, "$1***");
}

/** Prisma puts its `P1001`-style code on `code` for query errors and on
 * `errorCode` for the ones thrown while the client is still connecting — and
 * leaves both undefined on several connection failures. So codes are a hint
 * here, never the whole answer; the message patterns below carry the weight. */
function errorCode(err: unknown): string {
  const e = err as { code?: unknown; errorCode?: unknown };
  if (typeof e?.code === "string") return e.code;
  if (typeof e?.errorCode === "string") return e.errorCode;
  return "";
}

/** Pull the sentence that says what actually went wrong.
 *
 * A Prisma error message opens with `Invalid ``prisma.user.count()`` invocation:`
 * and, when it can, a code frame of the calling source — the real cause is
 * several lines down. Taking the first line gets you "Invalid invocation",
 * which tells an admin nothing, and quoting the code frame can spill whatever
 * happened to be on those lines. */
function causeLine(raw: string): string {
  const line = raw
    .split("\n")
    .map((l) => l.trim())
    .find(
      (l) =>
        l.length > 0 &&
        !/^Invalid `.*` invocation/i.test(l) &&
        !/^→?\s*\d+\s/.test(l) && // code frame: "→ 23 await show(…)"
        !/:\d+:\d+$/.test(l) // the frame's own header: "/app/src/page.tsx:23:14"
    );
  return line ?? "Database call failed";
}

/** Classify a thrown database error. */
export function describeDbError(err: unknown): DbTrouble {
  const raw = err instanceof Error ? err.message : String(err);
  const message = redact(causeLine(raw)).slice(0, 300);
  const code = errorCode(err);

  if (!DB_URL_CONFIGURED() || code === "P1012" || /must start with the protocol/i.test(raw)) {
    return { kind: "unconfigured", transient: false, message };
  }

  // Reached something, and it said no. Retrying a wrong password or a database
  // that isn't there just spends the pool to be told the same thing again.
  if (
    code === "P1000" ||
    code === "P1003" ||
    /Database `[^`]*` does not exist|denied access|authentication failed|role .* does not exist/i.test(
      raw
    )
  ) {
    return { kind: "unreachable", transient: false, message };
  }

  // The pooler is full, or Prisma's own pool is. Both mean "try again".
  if (
    code === "P2024" ||
    /max clients reached|EMAXCONNSESSION|too many clients|too many connections|remaining connection slots|Timed out fetching a new connection/i.test(
      raw
    )
  ) {
    return { kind: "capacity", transient: true, message };
  }

  // A connection that went away mid-flight, or one that never opened. Also
  // covers the prepared-statement clash a transaction-mode pooler causes on a
  // recycled connection, which a retry on a fresh one gets past.
  if (
    code === "P1001" ||
    code === "P1002" ||
    code === "P1017" ||
    /Can't reach database server|Connection refused|ECONNREFUSED|ECONNRESET|ENOTFOUND|EPIPE|ETIMEDOUT|Server has closed the connection|connection.*(closed|terminated|reset)|prepared statement .* (already exists|does not exist)/i.test(
      raw
    )
  ) {
    return { kind: "unreachable", transient: true, message };
  }

  if (
    code === "P2021" ||
    code === "P2022" ||
    /relation "[^"]*" does not exist|table .* does not exist|column .* does not exist/i.test(raw)
  ) {
    return { kind: "schema", transient: false, message };
  }

  return { kind: "unknown", transient: false, message };
}

// ─── What went wrong on *this* request ───────────────────────────────────────

interface DbStatusBox {
  trouble: DbTrouble | null;
  /** Set on every successful query, so "we got answers" is provable rather
   * than assumed from an absence of errors. */
  succeeded: boolean;
  at: number;
}

/** Request-scoped: `cache()` hands every request its own box, so one visitor's
 * outage can't be reported to the next. */
const requestBox = cache((): DbStatusBox => ({ trouble: null, succeeded: false, at: Date.now() }));

/** Outside a React request scope — a route handler, a cron job, a test —
 * there is nothing to scope to, and `cache()` doesn't say so: it quietly hands
 * back a *new* object on every call, so anything written to one is lost. Two
 * calls returning the same object is the only reliable way to tell that the
 * memoisation is real. Where it isn't, a module-level box keeps `safe()`
 * working, and the timestamp stops one job's failure being reported as the
 * next one's. */
let fallbackBox: DbStatusBox = { trouble: null, succeeded: false, at: 0 };
const FALLBACK_TTL_MS = 2_000;

function statusBox(): DbStatusBox {
  try {
    const box = requestBox();
    if (box === requestBox()) return box;
  } catch {
    // Some React versions throw instead of degrading. Same conclusion.
  }
  if (Date.now() - fallbackBox.at > FALLBACK_TTL_MS) {
    fallbackBox = { trouble: null, succeeded: false, at: Date.now() };
  }
  return fallbackBox;
}

/** The trouble `safe()` ran into while building this page, or null if every
 * query it ran came back.
 *
 * Call it *after* awaiting the page's queries. This is deliberately not a
 * probe: a separate `SELECT 1` costs a round trip, can disagree with the
 * queries whose results are actually on screen, and — when a pool is the
 * problem — is one more connection competing for the pool it's reporting on. */
export function dbTrouble(): DbTrouble | null {
  return statusBox().trouble;
}

const RETRY_DELAYS_MS = [120, 350];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Run a DB query and fall back to a default if it throws (e.g. no database
 * configured yet, or preview mode). Keeps gated pages from 500-ing.
 *
 * Transient failures are retried before the fallback is taken, because the
 * fallback is a lie the page then presents as fact — an empty list where there
 * are rows, a zero where there are members. A pooler that's full this
 * millisecond usually isn't two hundred milliseconds later, and that is a much
 * better answer than a confident wrong one. */
export async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      const result = await fn();
      statusBox().succeeded = true;
      return result;
    } catch (err) {
      const trouble = describeDbError(err);
      if (trouble.transient && attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      console.error(`safe() query failed (${trouble.kind}):`, err);
      const box = statusBox();
      // Keep the first real failure: it's the one closest to the cause.
      box.trouble ??= trouble;
      box.at = Date.now();
      return fallback;
    }
  }
}

/** An explicit round trip to the database, for the pages whose job is to report
 * on the connection itself (`/setup`, `/api/health`). Memoised per request. */
export const pingDatabase = cache(async (): Promise<{ ok: boolean; trouble: DbTrouble | null }> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, trouble: null };
  } catch (err) {
    const trouble = describeDbError(err);
    console.error(`pingDatabase() failed (${trouble.kind}):`, err);
    return { ok: false, trouble };
  }
});

/** Whether the database is actually reachable. Prefer `dbTrouble()` on a page
 * that already runs queries — this spends a connection to ask a question those
 * queries have already answered. */
export async function dbReachable(): Promise<boolean> {
  return (await pingDatabase()).ok;
}
