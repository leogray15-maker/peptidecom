import { PageHeader } from "@/components/page-header";
import { PeerSupportNote } from "@/components/peer-support-note";
import { PoemClient } from "@/components/poem-client";

export const metadata = { title: "POEM weekly score" };

export default function PoemPage() {
  return (
    <div>
      <PageHeader
        title="POEM weekly score"
        subtitle="The 7-question Patient-Oriented Eczema Measure — validated, quick, and built for week-on-week tracking. Answer for the last 7 days and watch the trend."
      />
      <PoemClient />
      <PeerSupportNote />
    </div>
  );
}
