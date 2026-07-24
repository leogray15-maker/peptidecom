"use client";

import { useEffect, useState } from "react";
import { type ConsentKey, getConsent, setConsent } from "@/lib/consent";
import { cn } from "@/lib/utils";

interface Toggle {
  key: ConsentKey;
  title: string;
  description: string;
}

const TOGGLES: Toggle[] = [
  {
    key: "photoEstimate",
    title: "On-device photo grading",
    description:
      "Runs a free colour analysis of your skin photos on your device to estimate a 0–100 severity. The photo never leaves your phone for this. Turn off to skip the estimate entirely.",
  },
  {
    key: "toolHistory",
    title: "Save tool history on this device",
    description:
      "Keeps your EASI and POEM scores in this browser so you can see the trend. Stored only on this device, never uploaded. Turn off to stop saving and keep the calculators memory-free.",
  },
];

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition",
        on ? "bg-brand-500" : "bg-lab-border"
      )}
    >
      <span
        className={cn(
          "absolute top-1 h-5 w-5 rounded-full bg-white transition-all",
          on ? "left-6" : "left-1"
        )}
      />
    </button>
  );
}

export function PrivacySourcesToggles() {
  const [state, setState] = useState<Record<ConsentKey, boolean>>({
    photoEstimate: true,
    toolHistory: true,
  });

  useEffect(() => {
    setState({
      photoEstimate: getConsent("photoEstimate"),
      toolHistory: getConsent("toolHistory"),
    });
  }, []);

  function toggle(key: ConsentKey) {
    setState((cur) => {
      const next = !cur[key];
      setConsent(key, next);
      return { ...cur, [key]: next };
    });
  }

  return (
    <div className="space-y-3">
      {TOGGLES.map((t) => (
        <div
          key={t.key}
          className="flex items-start justify-between gap-4 rounded-2xl border border-lab-border bg-lab-bg p-4"
        >
          <div>
            <p className="font-semibold text-white">{t.title}</p>
            <p className="mt-1 text-sm text-slate-400">{t.description}</p>
          </div>
          <Switch on={state[t.key]} onClick={() => toggle(t.key)} />
        </div>
      ))}
    </div>
  );
}
