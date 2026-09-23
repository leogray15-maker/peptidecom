import { HeartHandshake } from "lucide-react";

export function DisclaimerBar() {
  return (
    <div className="w-full border-b border-lab-line bg-lab-sunken px-3 py-1.5 text-center font-mono text-[9.5px] font-medium tracking-[0.04em] text-slate-400 sm:text-[11px] sm:tracking-[0.12em]">
      <span className="inline-flex items-center gap-1.5">
        <HeartHandshake className="h-3 w-3 shrink-0" />
        <span className="text-balance">
          PEER SUPPORT &amp; EDUCATION COMMUNITY · NOT MEDICAL ADVICE
        </span>
      </span>
    </div>
  );
}
