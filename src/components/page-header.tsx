import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * Screen header.
 *
 * On phones it reads like a native app screen: a circular back button on the
 * left and the title centred over it. From `sm` up it relaxes into the
 * left-aligned page title the desktop layout wants. Pass `back` on any screen
 * a member drills into from somewhere else.
 */
export function PageHeader({
  title,
  subtitle,
  action,
  back,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** Where the back chevron goes. Omit on top-level tab screens. */
  back?: string;
}) {
  return (
    <div className="mb-6">
      {/* Phone: centred title with the back affordance floating left. */}
      <div className="relative flex min-h-11 items-center justify-center sm:hidden">
        {back && (
          <Link href={back} aria-label="Back" className="icon-circle absolute left-0">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        )}
        <h1 className="max-w-[70%] truncate text-center text-lg font-bold text-white">
          {title}
        </h1>
      </div>

      {/* Tablet and up: the classic left-aligned page title. */}
      <div className="hidden flex-wrap items-end justify-between gap-4 sm:flex">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>

      {/* Subtitle and actions stack under the centred title on phones. */}
      {subtitle && (
        <p className="mt-3 text-center text-sm text-slate-400 sm:hidden">{subtitle}</p>
      )}
      {action && <div className="mt-4 flex justify-center sm:hidden">{action}</div>}
    </div>
  );
}
