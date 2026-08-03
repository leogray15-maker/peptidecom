import "server-only";
import { prisma } from "@/lib/prisma";

/** Run a DB query and fall back to a default if it throws (e.g. no database
 * configured yet, or preview mode). Keeps gated pages from 500-ing. */
export async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error("safe() query failed:", err);
    return fallback;
  }
}

/** Whether the database is actually reachable.
 *
 * safe() returns the same empty result for "no rows yet" and "no database",
 * which makes an outage look like an empty CRM — every tile reads 0 and every
 * list says "none yet", with nothing on screen to say why. Pages that would
 * otherwise present those zeros as fact should call this and say so instead. */
export async function dbReachable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (err) {
    console.error("dbReachable() failed:", err);
    return false;
  }
}
