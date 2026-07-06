import { HeartHandshake } from "lucide-react";

export function DisclaimerBar() {
  return (
    <div className="w-full border-b border-lab-border bg-brand-950/60 px-3 py-1.5 text-center text-[10px] font-medium tracking-wide text-brand-100 sm:text-[11px]">
      <span className="inline-flex items-center gap-1.5">
        <HeartHandshake className="h-3 w-3 shrink-0" />
        <span className="text-balance">
          PEER SUPPORT &amp; EDUCATION COMMUNITY · NOT MEDICAL ADVICE
        </span>
      </span>
    </div>
  );
}
