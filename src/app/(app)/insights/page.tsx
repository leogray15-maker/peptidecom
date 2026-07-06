import { PageHeader } from "@/components/page-header";
import { InsightsClient } from "@/components/insights-client";
import { PeerSupportNote } from "@/components/peer-support-note";
import { getCurrentUser } from "@/lib/auth";
import { safe } from "@/lib/safe-db";
import { type DailyLog, dateKey } from "@/lib/tsw";
import { listLogs, tswKey } from "@/lib/tsw-db";

export const metadata = { title: "Insights" };

export default async function InsightsPage() {
  const user = await getCurrentUser();
  const since = new Date();
  since.setDate(since.getDate() - 60);
  const logs = user
    ? await safe(() => listLogs(tswKey(user), dateKey(since)), [] as DailyLog[])
    : [];

  return (
    <div>
      <PageHeader
        title="Your trends"
        subtitle="Your own data, reflected gently back. Trends beat snapshots — especially on the hard days."
      />
      <InsightsClient logs={logs} />
      <PeerSupportNote />
    </div>
  );
}
