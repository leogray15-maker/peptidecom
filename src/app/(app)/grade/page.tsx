import { PageHeader } from "@/components/page-header";
import { PeerSupportNote } from "@/components/peer-support-note";
import { GradeClient, type GradedPhoto } from "@/components/grade-client";
import { getCurrentUser } from "@/lib/auth";
import { getCondition } from "@/lib/conditions";
import { safe } from "@/lib/safe-db";
import { type DailyLog } from "@/lib/tsw";
import { type TswPhoto, type TswProfile, getProfile, listLogs, listPhotos, tswKey } from "@/lib/tsw-db";

export const metadata = { title: "AI flare grading" };

export default async function GradePage() {
  const user = await getCurrentUser();
  const uid = user ? tswKey(user) : null;
  const [photos, logs, profile] = uid
    ? await Promise.all([
        safe(() => listPhotos(uid), [] as TswPhoto[]),
        safe(() => listLogs(uid), [] as DailyLog[]),
        safe(() => getProfile(uid), {} as TswProfile),
      ])
    : [[], [], {} as TswProfile];
  const condition = getCondition(profile.condition);

  // Previously graded photos give the personal baseline (so skin tone and usual
  // lighting cancel out) and let the tool report how well it has been agreeing
  // with the member's own tracker ratings.
  const graded: GradedPhoto[] = photos
    .filter((p) => p.estimate)
    .map((p) => ({
      takenAt: p.takenAt,
      area: p.area,
      composite: p.estimate!.composite,
      score: p.estimate!.score,
    }));

  const manualSeverityByDate = Object.fromEntries(logs.map((l) => [l.date, l.severity]));

  return (
    <div>
      <PageHeader
        title="AI flare grading"
        subtitle="Photograph an itchy patch and get a 0–100 estimate of how inflamed it looks — worked out on your device, never uploaded. Educational, not diagnostic."
      />
      <GradeClient
        graded={graded}
        manualSeverityByDate={manualSeverityByDate}
        zones={condition.zones}
      />
      <PeerSupportNote />
    </div>
  );
}
