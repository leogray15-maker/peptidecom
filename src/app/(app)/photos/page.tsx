import { PageHeader } from "@/components/page-header";
import { PeerSupportNote } from "@/components/peer-support-note";
import { PhotosClient } from "@/components/photos-client";
import { getCurrentUser } from "@/lib/auth";
import { safe } from "@/lib/safe-db";
import { type DailyLog } from "@/lib/tsw";
import { type TswPhoto, listLogs, listPhotos, tswKey } from "@/lib/tsw-db";

export const metadata = { title: "Photo timeline" };

export default async function PhotosPage() {
  const user = await getCurrentUser();
  const uid = user ? tswKey(user) : null;
  const [photos, logs] = uid
    ? await Promise.all([
        safe(() => listPhotos(uid), [] as TswPhoto[]),
        safe(() => listLogs(uid), [] as DailyLog[]),
      ])
    : [[], []];

  // Manual severity per date — lets the client show how well the photo
  // estimate has been agreeing with the member's own ratings.
  const manualSeverityByDate = Object.fromEntries(logs.map((l) => [l.date, l.severity]));

  return (
    <div>
      <PageHeader
        title="Photo progress timeline"
        subtitle="Your skin heals slower than memory fades. These photos remember for you — privately, unless you choose otherwise."
      />
      <PhotosClient
        initialPhotos={photos.map((p) => ({
          id: p.id,
          takenAt: p.takenAt,
          area: p.area,
          caption: p.caption,
          imageData: p.imageData,
          shared: p.shared,
          estimate: p.estimate ?? null,
        }))}
        manualSeverityByDate={manualSeverityByDate}
      />
      <PeerSupportNote />
    </div>
  );
}
