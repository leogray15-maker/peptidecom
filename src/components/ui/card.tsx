import { cn } from "@/lib/utils";

/** Bordered surface. 14px radius, 20–24px padding, no shadow. */
export function Card({
  className,
  as: Tag = "section",
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: "section" | "div" | "article" | "li" }) {
  return <Tag className={cn("card", className)} {...props} />;
}

/** Card title row: 15/600 title, optional meta line and right-hand slot. */
export function CardHeader({
  title,
  subtitle,
  action,
  className,
  as: Heading = "h2",
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  as?: "h2" | "h3";
}) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <Heading className="card-title">{title}</Heading>
        {subtitle && <p className="mt-0.5 text-meta text-fg-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
