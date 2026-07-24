import { PageHeader } from "@/components/page-header";
import { PeerSupportNote } from "@/components/peer-support-note";
import { ScanClient } from "@/components/scan-client";

export const metadata = { title: "Ingredient scanner" };

export default function ScanPage() {
  return (
    <div>
      <PageHeader
        title="Ingredient scanner"
        subtitle="Scan a product's barcode — we look it up and grade it 0–100 for sensitive, eczema-prone skin, with the irritants and the barrier-friendly ingredients broken out. No barcode? Paste the list instead."
      />
      <ScanClient />
      <PeerSupportNote />
    </div>
  );
}
