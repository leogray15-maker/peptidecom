import { Activity } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Arcane Track";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-lg shadow-brand-900/40">
        <Activity className="h-5 w-5 text-white" />
      </span>
      <span className="text-lg font-bold tracking-tight text-white">
        {appName}
      </span>
    </Link>
  );
}
