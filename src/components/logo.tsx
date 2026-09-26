import Link from "next/link";
import { ArcaneMark } from "@/components/arcane-mark";
import { cn } from "@/lib/utils";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Arcane Track";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="grid h-[30px] w-[30px] place-items-center rounded-[8px] bg-primary transition-colors group-hover:bg-primary-hover">
        <ArcaneMark className="h-[19px] w-[19px] text-white" />
      </span>
      <span className="text-[15px] font-semibold tracking-[-0.01em] text-fg">
        {appName}
      </span>
    </Link>
  );
}
