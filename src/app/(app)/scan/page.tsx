import { PageHeader } from "@/components/page-header";
import { PeerSupportNote } from "@/components/peer-support-note";
import { ScanClient } from "@/components/scan-client";

export const metadata = { title: "Ingredient scanner" };

export default function ScanPage() {
  return (
    <div>
      <PageHeader
        title="Ingredient scanner"
        subtitle="Paste a product's ingredient list — we flag common irritants and contact allergens on your device, before it becomes part of your routine. 100% on-device, nothing uploaded."
      />
      <ScanClient />
      <PeerSupportNote />
    </div>
  );
}
