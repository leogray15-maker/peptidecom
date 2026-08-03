import { PageHeader } from "@/components/page-header";
import { PeerSupportNote } from "@/components/peer-support-note";
import { RestaurantsClient } from "@/components/restaurants-client";

export const metadata = { title: "Healthy places to eat" };

export default function RestaurantsPage() {
  return (
    <div>
      <PageHeader
        title="Healthy places to eat"
        subtitle="Every restaurant, café and takeaway around you, scored 0–100 for how healthy eating there is likely to be — on a map, healthiest first. Built from open map data, so it works anywhere in the world."
      />
      <RestaurantsClient />
      <PeerSupportNote />
    </div>
  );
}
