import { PageHeader } from "@/components/page-header";
import { PeerSupportNote } from "@/components/peer-support-note";
import { ScanClient } from "@/components/scan-client";

export const metadata = { title: "Ingredient scanner" };

export default function ScanPage() {
  return (
    <div>
      <PageHeader
        title="Product scanner"
        subtitle="Scan any barcode — skincare gets a 0–100 score for sensitive, eczema-prone skin (irritants vs barrier-friendly ingredients); food & drink get a nutrition score (Nutri-Score, additives, the good stuff). No barcode? Paste the ingredients instead."
      />
      <ScanClient />
      <PeerSupportNote />
    </div>
  );
}
