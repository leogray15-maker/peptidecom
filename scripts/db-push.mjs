// Push the Prisma schema to the database during the Vercel build, so the
// tables always exist in production without anyone running a CLI by hand.
// Resolves the connection string from the same env-var fallbacks the app uses.
import { spawnSync } from "node:child_process";

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;

if (!url) {
  console.log("[db-push] No database URL set — skipping schema push.");
  process.exit(0);
}

console.log("[db-push] Pushing Prisma schema to the database…");
const res = spawnSync("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url },
});

if (res.status !== 0) {
  console.error("[db-push] prisma db push failed — see output above.");
  process.exit(res.status ?? 1);
}
console.log("[db-push] Schema is up to date.");
