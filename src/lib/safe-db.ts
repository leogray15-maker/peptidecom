import "server-only";

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
