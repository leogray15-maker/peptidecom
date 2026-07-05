import { PageHeader } from "@/components/page-header";
import { PeerSupportNote } from "@/components/peer-support-note";
import { TrackerClient } from "@/components/tracker-client";
import { getCurrentUser } from "@/lib/auth";
import { safe } from "@/lib/safe-db";
import { type DailyLog, dateKey } from "@/lib/tsw";
import { listLogs, tswKey } from "@/lib/tsw-db";

export const metadata = { title: "Daily tracker" };

export default async function TrackerPage() {
  const user = await getCurrentUser();
  const since = new Date();
  since.setDate(since.getDate() - 9);
  const recentLogs = user
    ? await safe(() => listLogs(tswKey(user), dateKey(since)), [] as DailyLog[])
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
