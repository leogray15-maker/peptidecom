import { PageHeader } from "@/components/page-header";
import { PeerSupportNote } from "@/components/peer-support-note";
import { TimelineClient } from "@/components/timeline-client";
import { getCurrentUser } from "@/lib/auth";
import { safe } from "@/lib/safe-db";
import { getProfile, tswKey } from "@/lib/tsw-db";

export const metadata = { title: "Where am I in this?" };

export default async function TimelinePage() {
  const user = await getCurrentUser();
  const profile = user ? await safe(() => getProfile(tswKey(user)), {}) : {};

  return (
    <div>
      <PageHeader
        title="Where am I in this?"
        subtitle="A rough map of the road many people walk. Mark where you are — not to be graded, just so this place can meet you there."
      />
      <TimelineClient currentStage={profile.recoveryStage ?? null} />
      <PeerSupportNote />
    </div>
  );
}
