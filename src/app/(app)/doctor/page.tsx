import { DoctorClient } from "@/components/doctor-client";
import { PageHeader } from "@/components/page-header";
import { PeerSupportNote } from "@/components/peer-support-note";
import { getCurrentUser } from "@/lib/auth";
import { safe } from "@/lib/safe-db";
import { type DailyLog, dateKey } from "@/lib/tsw";
import { type TriggerLog, listLogs, listTriggers, tswKey } from "@/lib/tsw-db";

export const metadata = { title: "Questions for your doctor" };

export default async function DoctorPage() {
  const user = await getCurrentUser();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const [logs, triggers] = user
    ? await Promise.all([
        safe(() => listLogs(tswKey(user), dateKey(since)), [] as DailyLog[]),
        safe(() => listTriggers(tswKey(user)), [] as TriggerLog[]),
      ])
    : [[], []];

  return (
    <div>
      <PageHeader
        title="Questions for your doctor"
        subtitle="Walk in with a month of data and a clear list. Five-minute appointments go differently when you do."
      />
      <DoctorClient
        logs={logs}
        triggers={triggers.map((t) => ({
          id: t.id,
          date: t.date,
          kind: t.kind,
          name: t.name,
          effect: t.effect,
          note: t.note,
        }))}
        userName={user?.name ?? null}
      />
      <div className="no-print">
        <PeerSupportNote />
      </div>
    </div>
  );
}
