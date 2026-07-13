import { PageHeader } from "@/components/page-header";
import { PeerSupportNote } from "@/components/peer-support-note";
import { TimelineClient } from "@/components/timeline-client";
import { getCurrentUser } from "@/lib/auth";
import { getCondition } from "@/lib/conditions";
import { safe } from "@/lib/safe-db";
import { getProfile, tswKey } from "@/lib/tsw-db";

export const metadata = { title: "Where am I in this?" };

export default async function TimelinePage() {
  const user = await getCurrentUser();
  const profile = user ? await safe(() => getProfile(tswKey(user)), {}) : {};
  const condition = getCondition(profile.condition);

  return (
    <div>
      <PageHeader title={condition.timeline.title} subtitle={condition.timeline.subtitle} />
      <TimelineClient
        currentStage={profile.recoveryStage ?? null}
        startDate={profile.tswStartDate ?? null}
        stages={condition.stages}
        startDateQuestion={condition.startDateQuestion}
      />
      <PeerSupportNote />
    </div>
  );
}
