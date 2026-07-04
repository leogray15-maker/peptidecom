import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safe } from "@/lib/safe-db";
import { ProgressClient } from "@/components/progress-client";

export const metadata = { title: "Progress" };

export default async function ProgressPage() {
  const user = await getCurrentUser();
  const logs = await safe(
    () =>
      prisma.progressLog.findMany({
        where: { userId: user?.id ?? "" },
        orderBy: { date: "asc" },
        take: 365,
      }),
    [] as Awaited<ReturnType<typeof prisma.progressLog.findMany>>
  );

  // Serialize dates for the client component.
  const serialized = logs.map((l) => ({
    id: l.id,
    date: l.date.toISOString(),
    weightKg: l.weightKg,
    waistCm: l.waistCm,
    bodyFatPct: l.bodyFatPct,
    mood: l.mood,
    sideEffects: l.sideEffects,
    notes: l.notes,
  }));

  return (
    <div>
      <PageHeader
        title="Progress"
        subtitle="Private to you. Track weight, measurements and how you feel over time."
      />
      <ProgressClient initialLogs={serialized} />
    </div>
  );
}
