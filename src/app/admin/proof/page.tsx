import { ProofPanel } from "@/components/admin/proof-panel";
import { getProofWall } from "@/lib/proof-admin";

export const metadata = { title: "Proof wall" };

/** The one screen that controls what the public pages show as proof: approve
 * entries onto the site, set the running order, and upload the photos. */
export default async function AdminProofPage() {
  const wall = await getProofWall();
  return <ProofPanel wall={wall} />;
}
