import { CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Setup status" };

type Check = { label: string; ok: boolean; detail?: string };

async function runChecks(): Promise<{ env: Check[]; services: Check[]; commit: string }> {
  const envVar = (label: string, present: boolean): Check => ({ label, ok: present });

  const env: Check[] = [
    envVar(
      "DATABASE_URL (or POSTGRES_URL)",
      !!process.env.DATABASE_URL ||
        !!process.env.POSTGRES_URL_NON_POOLING ||
        !!process.env.POSTGRES_PRISMA_URL ||
        !!process.env.POSTGRES_URL
    ),
    envVar("NEXT_PUBLIC_FIREBASE_API_KEY", !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    envVar("NEXT_PUBLIC_FIREBASE_PROJECT_ID", !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    envVar("NEXT_PUBLIC_FIREBASE_APP_ID", !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
    envVar("FIREBASE_PROJECT_ID", !!process.env.FIREBASE_PROJECT_ID),
    envVar("FIREBASE_CLIENT_EMAIL", !!process.env.FIREBASE_CLIENT_EMAIL),
    envVar("FIREBASE_PRIVATE_KEY", !!process.env.FIREBASE_PRIVATE_KEY),
    envVar("STRIPE_SECRET_KEY", !!process.env.STRIPE_SECRET_KEY),
    envVar("STRIPE_WEBHOOK_SECRET", !!process.env.STRIPE_WEBHOOK_SECRET),
    envVar("STRIPE_PRICE_MONTHLY", !!process.env.STRIPE_PRICE_MONTHLY),
    envVar("STRIPE_PRICE_ANNUAL", !!process.env.STRIPE_PRICE_ANNUAL),
  ];

  const services: Check[] = [];

  // Reach the DB *and* confirm the schema is migrated. A bare `SELECT 1` passes
  // even when `prisma db push` was never run, so signup then 503s ("not
  // migrated") while this page looks green. Querying the real User table catches
  // that: a "does not exist" error means the tables aren't created yet.
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    try {
      await prisma.user.count();
      services.push({ label: "Postgres database (schema migrated)", ok: true });
    } catch (e) {
      const msg = (e as Error).message?.split("\n")[0] ?? "";
      services.push({
        label: "Postgres database (schema migrated)",
        ok: false,
        detail: /exist|relation|table/i.test(msg)
          ? "Connected, but tables are missing. Run `prisma db push` (or `npm run db:push`)."
          : msg,
      });
    }
  } catch (e) {
    services.push({ label: "Postgres database (schema migrated)", ok: false, detail: (e as Error).message?.split("\n")[0] });
  }

  try {
    const { adminAuth } = await import("@/lib/firebase-admin");
    await (await adminAuth()).createCustomToken("setup-check");
    services.push({ label: "Firebase Admin (server)", ok: true });
  } catch (e) {
    services.push({ label: "Firebase Admin (server)", ok: false, detail: (e as Error).message?.split("\n")[0] });
  }

  // Client and server must point at the SAME Firebase project. A mismatch makes
  // every sign-in fail at token verification with "Invalid or expired token".
  try {
    const { adminProjectId } = await import("@/lib/firebase-admin");
    const clientPid = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const serverPid = adminProjectId();
    if (!clientPid || !serverPid) {
      services.push({
        label: "Firebase project IDs match (client ↔ server)",
        ok: false,
        detail: "Can't compare — a Firebase project id is missing above.",
      });
    } else if (clientPid === serverPid) {
      services.push({ label: "Firebase project IDs match (client ↔ server)", ok: true });
    } else {
      services.push({
        label: "Firebase project IDs match (client ↔ server)",
        ok: false,
        detail: `Mismatch: client "${clientPid}" vs server "${serverPid}". Sign-in tokens won't verify.`,
      });
    }
  } catch (e) {
    services.push({ label: "Firebase project IDs match (client ↔ server)", ok: false, detail: (e as Error).message?.split("\n")[0] });
  }

  return { env, services, commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "local" };
}

function Row({ c }: { c: Check }) {
  return (
    <li className="flex items-start gap-3 py-2 text-sm">
      {c.ok ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
      ) : (
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
      )}
      <div>
        <span className={c.ok ? "text-slate-200" : "text-slate-200"}>{c.label}</span>
        {c.detail && <p className="text-xs text-red-300/80">{c.detail}</p>}
      </div>
    </li>
  );
}

export default async function SetupPage() {
  const { env, services, commit } = await runChecks();
  const allOk = [...env, ...services].every((c) => c.ok);

  return (
    <div className="container-lab py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-white">Setup status</h1>
        <p className="mt-1 text-sm text-slate-400">
          Deploy commit: <code className="text-slate-300">{commit}</code>
        </p>

        <div
          className={`mt-4 rounded-xl border p-3 text-sm ${
            allOk
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-amber-500/30 bg-amber-500/10 text-amber-200"
          }`}
        >
          {allOk
            ? "Everything is wired up. You're good to go."
            : "Some things aren't configured yet — see the red items below. Add them in Vercel → Settings → Environment Variables (Production) and redeploy."}
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="card">
            <h2 className="font-semibold text-white">Environment variables</h2>
            <ul className="mt-2 divide-y divide-lab-border">
              {env.map((c) => <Row key={c.label} c={c} />)}
            </ul>
          </div>
          <div className="card">
            <h2 className="font-semibold text-white">Live connections</h2>
            <ul className="mt-2 divide-y divide-lab-border">
              {services.map((c) => <Row key={c.label} c={c} />)}
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              This page is a diagnostic. Remove or protect it before a public launch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
