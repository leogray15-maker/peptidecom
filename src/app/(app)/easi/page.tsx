import { PageHeader } from "@/components/page-header";
import { PeerSupportNote } from "@/components/peer-support-note";
import { EasiClient } from "@/components/easi-client";

export const metadata = { title: "EASI calculator" };

export default function EasiPage() {
  return (
    <div>
      <PageHeader
        title="EASI calculator"
        subtitle="The Eczema Area & Severity Index — the structured score dermatologists use. Score each region, track it over time, bring it to your appointment."
      />
      <EasiClient />
      <PeerSupportNote />
    </div>
  );
}
