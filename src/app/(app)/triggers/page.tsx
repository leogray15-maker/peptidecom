import { PageHeader } from "@/components/page-header";
import { PeerSupportNote } from "@/components/peer-support-note";
import { TriggersClient } from "@/components/triggers-client";
import { getCurrentUser } from "@/lib/auth";
import { safe } from "@/lib/safe-db";
import { type TriggerLog, listTriggers, tswKey } from "@/lib/tsw-db";

export const metadata = { title: "Triggers & routine" };

export default async function TriggersPage() {
  const user = await getCurrentUser();
  const entries = user
    ? await safe(() => listTriggers(tswKey(user)), [] as TriggerLog[])
    : [];

  return (
    <div>
      <PageHeader
        title="Triggers & routine log"
        subtitle="Moisturisers, foods, weather, stress — log what touches your life and let your own patterns surface."
      />
      <TriggersClient
        initialEntries={entries.map((e) => ({
          id: e.id,
          date: e.date,
          kind: e.kind,
          name: e.name,
          effect: e.effect,
          note: e.note,
        }))}
      />
      <PeerSupportNote />
    </div>
  );
}
