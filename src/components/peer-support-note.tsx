import { HeartHandshake } from "lucide-react";

/** Light-touch disclaimer for the recovery/health pages. */
export function PeerSupportNote() {
  return (
    <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
      <HeartHandshake className="h-3.5 w-3.5 shrink-0" />
      Peer support and self-tracking, not medical advice. For diagnosis and treatment, please
      work with a qualified clinician — the doctor-prep tool can help you get more from those visits.
    </p>
  );
}
