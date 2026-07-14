import { PageHeader } from "@/components/page-header";
import { PeerSupportNote } from "@/components/peer-support-note";
import { TrackerClient } from "@/components/tracker-client";
import { getCurrentUser } from "@/lib/auth";
import { getCondition } from "@/lib/conditions";
import { safe } from "@/lib/safe-db";
import { type DailyLog } from "@/lib/tsw";
import { type TswProfile, getProfile, listLogs, tswKey } from "@/lib/tsw-db";

export const metadata = { title: "Daily tracker" };

export default async function TrackerPage() {
  const user = await getCurrentUser();
  const uid = user ? tswKey(user) : null;
  // Full history: the client renders today's quick-log plus a look-back list
  // of every past entry (areas, severity, symptoms, sleep, mood, notes).
  const [recentLogs, profile] = uid
    ? await Promise.all([
        safe(() => listLogs(uid), [] as DailyLog[]),
        safe(() => getProfile(uid), {} as TswProfile),
      ])
    : [[], {} as TswProfile];
  const condition = getCondition(profile.condition);

  return (
    <div>
      <PageHeader
        title="How is your skin today?"
        subtitle="Twenty seconds, once a day. That's all this asks — and it adds up to a map of your recovery."
      />
      <TrackerClient
        recentLogs={recentLogs}
        zones={condition.zones}
        symptoms={condition.symptoms.map((s) => ({ id: s.id, label: s.label }))}
      />
      <PeerSupportNote />
    </div>
  );
}
