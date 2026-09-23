import Link from "next/link";
import { ArcaneMark } from "@/components/arcane-mark";
import { cn } from "@/lib/utils";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Arcane Track";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-brand-600 transition group-hover:bg-brand-500">
        <ArcaneMark className="h-6 w-6 text-white" />
      </span>
      <span className="font-display text-[1.2rem] font-medium tracking-tight text-white">
        {appName}
      </span>
    </Link>
  );
}
