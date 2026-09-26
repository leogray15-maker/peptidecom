import { PageHeader } from "@/components/page-header";
import { PeerSupportNote } from "@/components/peer-support-note";
import { ScanClient } from "@/components/scan-client";

export const metadata = { title: "Ingredient scanner" };

export default function ScanPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Skin tools"
        title="Product scanner"
        subtitle="Scan a barcode for a 0–100 score: skincare on irritants versus barrier-friendly ingredients, food and drink on nutrition."
      />
      <ScanClient />
      <PeerSupportNote />
    </div>
  );
}
