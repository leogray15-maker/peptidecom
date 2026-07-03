import { FlaskConical } from "lucide-react";

export function DisclaimerBar() {
  return (
    <div className="w-full border-b border-lab-border bg-brand-950/60 py-1.5 text-center text-[11px] font-medium tracking-wide text-brand-100">
      <span className="inline-flex items-center gap-1.5">
        <FlaskConical className="h-3 w-3" />
        FOR RESEARCH PURPOSES ONLY · NOT FOR HUMAN CONSUMPTION · NOT MEDICAL ADVICE
      </span>
    </div>
  );
}
