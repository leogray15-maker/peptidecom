import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl, shouldTune, tuneConnection } from "@/lib/db-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const rawUrl = resolveDatabaseUrl();
const databaseUrl = rawUrl ? tuneConnection(rawUrl) : undefined;

/** True when the app is talking to Postgres through a pooler — reported by the
 * diagnostics pages, since it changes what a connection error means. */
export const usingPooledConnection = !!rawUrl && shouldTune(rawUrl);

/** Cached on `globalThis` in **every** environment, not just development.
 * Next.js bundles a module once per route it's imported from, so without this
 * a single lambda can end up holding several clients — and several pools —
 * against a pooler that is counting connections. */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(databaseUrl ? { datasourceUrl: databaseUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
