import { PageHeader } from "@/components/page-header";
import { PeerSupportNote } from "@/components/peer-support-note";
import { PhotosClient } from "@/components/photos-client";
import { getCurrentUser } from "@/lib/auth";
import { safe } from "@/lib/safe-db";
import { type TswPhoto, listPhotos, tswKey } from "@/lib/tsw-db";

export const metadata = { title: "Photo timeline" };

export default async function PhotosPage() {
  const user = await getCurrentUser();
  const photos = user
    ? await safe(() => listPhotos(tswKey(user)), [] as TswPhoto[])
    : [];

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
        }))}
      />
      <PeerSupportNote />
    </div>
  );
}
