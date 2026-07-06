import { PageHeader } from "@/components/page-header";
import { PeerSupportNote } from "@/components/peer-support-note";
import { TrackerClient } from "@/components/tracker-client";
import { getCurrentUser } from "@/lib/auth";
import { safe } from "@/lib/safe-db";
import { type DailyLog } from "@/lib/tsw";
import { listLogs, tswKey } from "@/lib/tsw-db";

export const metadata = { title: "Daily tracker" };

export default async function TrackerPage() {
  const user = await getCurrentUser();
  // Full history: the client renders today's quick-log plus a look-back list
  // of every past entry (areas, severity, symptoms, sleep, mood, notes).
  const recentLogs = user
    ? await safe(() => listLogs(tswKey(user)), [] as DailyLog[])
    : [];

  return (
    <div>
      <PageHeader
        title="How is your skin today?"
        subtitle="Twenty seconds, once a day. That's all this asks — and it adds up to a map of your recovery."
      />
      <TrackerClient recentLogs={recentLogs} />
      <PeerSupportNote />
    </div>
  );
}
