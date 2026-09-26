import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * One row in a list card: optional leading media, title + meta, trailing slot.
 * Renders as a link when `href` is given, a button with `onClick`, else a div.
 */
export function ListRow({
  leading,
  title,
  meta,
  trailing,
  href,
  onClick,
  className,
  ...rest
}: {
  leading?: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLElement>, "title" | "onClick">) {
  const inner = (
    <>
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-fg">{title}</div>
        {meta && <div className="mt-0.5 truncate text-meta text-fg-muted">{meta}</div>}
      </div>
      {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
    </>
  );
  const cls = cn(
    "flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left",
    (href || onClick) && "transition-colors duration-150 ease-out hover:bg-surface-active",
    className
  );
  if (href)
    return (
      <Link href={href} className={cls} {...rest}>
        {inner}
      </Link>
    );
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cls} {...rest}>
        {inner}
      </button>
    );
  return (
    <div className={cls} {...rest}>
      {inner}
    </div>
  );
}

/** Simple data table with the card chrome. Columns are plain render fns. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  caption,
}: {
  columns: { key: string; header: string; cell: (row: T) => React.ReactNode; className?: string }[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: React.ReactNode;
  caption?: string;
}) {
  if (rows.length === 0 && empty) return <>{empty}</>;
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface">
      <table className="w-full min-w-[560px] text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-line">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn("section-label px-4 py-3 font-medium", c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line-subtle">
          {rows.map((r) => (
            <tr key={rowKey(r)} className="hover:bg-surface-active/60">
              {columns.map((c) => (
                <td key={c.key} className={cn("px-4 py-3 text-fg-secondary", c.className)}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
