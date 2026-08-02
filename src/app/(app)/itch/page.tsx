import { ItchClient, type ItchEntry } from "@/components/itch-client";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/auth";
import { safe } from "@/lib/safe-db";
import { type ItchLog, listItchLogs, tswKey } from "@/lib/tsw-db";

export const metadata = { title: "Itch" };

export default async function ItchPage() {
  const user = await getCurrentUser();
  const uid = user ? tswKey(user) : null;
  const logs = uid ? await safe(() => listItchLogs(uid), [] as ItchLog[]) : [];

  const entries: ItchEntry[] = logs.map((l) => ({
    id: l.id,
    date: l.date,
    at: l.at,
    level: l.level,
    note: l.note ?? null,
    action: l.action ?? null,
  }));

  return (
    <div>
      <PageHeader
        title="Itch"
        subtitle="One tap, whenever it bites. Over a week it shows you when your itch really peaks."
      />
      <ItchClient entries={entries} />
    </div>
  );
}
