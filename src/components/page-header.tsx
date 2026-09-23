import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * Screen header.
 *
 * On phones a drill-in screen (one with `back`) reads like a native app
 * screen: a circular back button on the left and a compact title centred over
 * it. Top-level screens get a large left-aligned serif title instead, so a
 * tab root and a detail screen are told apart at a glance. From `sm` up both
 * relax into the left-aligned page title the desktop layout wants.
 */
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  action,
  back,
}: {
  title: string;
  subtitle?: string;
  /** Small mono label above the title (a date, a section name). */
  eyebrow?: string;
  action?: React.ReactNode;
  /** Where the back chevron goes. Omit on top-level tab screens. */
  back?: string;
}) {
  return (
    <div className="mb-6 sm:mb-8">
      {back ? (
        <>
          {/* Phone, drill-in: centred title with the back affordance left. */}
          <div className="relative flex min-h-11 items-center justify-center sm:hidden">
            <Link href={back} aria-label="Back" className="icon-circle absolute left-0">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="max-w-[70%] truncate text-center text-xl font-medium text-white">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="mt-3 text-center text-sm text-slate-400 sm:hidden">{subtitle}</p>
          )}
        </>
      ) : (
        /* Phone, top level: large left-aligned title. */
        <div className="sm:hidden">
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h1 className="text-[2rem] font-medium leading-[1.08] text-white">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-[15px] leading-relaxed text-slate-400">{subtitle}</p>
          )}
        </div>
      )}

      {/* Tablet and up: the classic left-aligned page title. */}
      <div className="hidden flex-wrap items-end justify-between gap-4 sm:flex">
        <div className="min-w-0">
          {back && (
            <Link
              href={back}
              className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-400 transition hover:text-brand-200"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
          )}
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h1 className="text-4xl font-medium leading-[1.05] text-white">{title}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-[15px] text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>

      {action && <div className="mt-4 flex sm:hidden">{action}</div>}
    </div>
  );
}
