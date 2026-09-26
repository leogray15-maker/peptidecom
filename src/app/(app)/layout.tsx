import { redirect } from "next/navigation";
import { getCurrentUser, hasAccess, isAdminEmail } from "@/lib/auth";
import { getLatestDigest } from "@/lib/digest-db";
import { LIBRARY } from "@/lib/protocols";
import { safe } from "@/lib/safe-db";
import { reconcileMembership } from "@/lib/stripe-sync";
import { type DailyLog, computeStats } from "@/lib/tsw";
import { listLogs, tswKey } from "@/lib/tsw-db";
import { sentenceCase } from "@/lib/utils";
import { AppShell } from "@/components/shell/app-shell";

// Member pages are per-request (auth + DB) and must never be prerendered at build.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/dashboard");
  }
  if (!hasAccess(user)) {
    // Before turning anyone away, check with Stripe: someone who has genuinely
    // just paid but whose webhook hasn't landed would otherwise be bounced
    // straight back to /pricing, with the Dashboard button looking dead.
    user = await reconcileMembership(user);
  }
  if (!hasAccess(user)) {
    redirect("/pricing");
  }

  const uid = tswKey(user);
  const [logs, digest] = await Promise.all([
    safe(() => listLogs(uid), [] as DailyLog[]),
    safe(() => getLatestDigest(uid), null),
  ]);
  const streak = computeStats(logs).streak;

  return (
    <AppShell
      user={{
        name: user.name,
        image: user.image,
        verified: user.verified,
        isAdmin: user.role === "ADMIN" || isAdminEmail(user.email),
      }}
      streak={streak}
      digest={
        digest
          ? { title: digest.title, body: digest.body, url: digest.url, weekEnding: digest.weekEnding }
          : null
      }
      protocols={LIBRARY.map((a) => ({ slug: a.slug, title: sentenceCase(a.title), category: a.category }))}
    >
      {children}
    </AppShell>
  );
}
