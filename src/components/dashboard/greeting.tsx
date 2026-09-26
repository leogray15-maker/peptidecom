"use client";

import { useEffect, useState } from "react";

function partOfDay(h: number) {
  if (h < 5) return "Good evening";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** Greeting and date in the member's own time zone (rendered on the client). */
export function Greeting({ name }: { name: string }) {
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => setHour(new Date().getHours()), []);
  return <>{`${hour == null ? "Welcome back" : partOfDay(hour)}, ${name}`}</>;
}

export function TodayEyebrow() {
  const [label, setLabel] = useState("Today");
  useEffect(() => {
    setLabel(
      new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date())
    );
  }, []);
  return <>{label}</>;
}
