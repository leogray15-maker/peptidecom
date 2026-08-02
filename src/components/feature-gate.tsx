import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The big centred "this screen isn't ready for you yet" panel: rounded icon
 * tile, headline, one paragraph of plain English, one loud action.
 *
 * Used for every dead end in the app — a tool that needs permission, a chart
 * with nothing in it yet, a feature that needs a couple of days of logs first —
 * so an empty screen always looks deliberate rather than broken.
 */
export function FeatureGate({
  icon: Icon,
  title,
  description,
  action,
  secondary,
  className,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  /** Primary call to action: an internal link, or a button the caller renders. */
  action?: { href: string; label: string } | React.ReactNode;
  secondary?: { href: string; label: string };
  className?: string;
}) {
  const isLinkAction =
    !!action && typeof action === "object" && action !== null && "href" in action;

  return (
    <div className={cn("flex flex-col items-center px-4 py-12 text-center", className)}>
      <div className="icon-tile">
        <Icon className="h-8 w-8" />
      </div>
      <h2 className="mt-6 max-w-sm text-2xl font-bold leading-tight text-white">{title}</h2>
      <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-slate-400">
        {description}
      </p>
      {action && (
        <div className="mt-7 w-full max-w-xs">
          {isLinkAction ? (
            <Link
              href={(action as { href: string }).href}
              className="btn-accent w-full"
            >
              {(action as { label: string }).label}
            </Link>
          ) : (
            (action as React.ReactNode)
          )}
        </div>
      )}
      {secondary && (
        <Link
          href={secondary.href}
          className="mt-4 text-sm font-medium text-brand-300 hover:text-brand-200"
        >
          {secondary.label}
        </Link>
      )}
    </div>
  );
}
