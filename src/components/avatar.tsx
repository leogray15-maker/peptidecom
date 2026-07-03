import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function Avatar({
  name,
  image,
  className,
}: {
  name?: string | null;
  image?: string | null;
  className?: string;
}) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={image}
        alt={name ?? "avatar"}
        className={cn("h-9 w-9 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full bg-brand-800 text-xs font-semibold text-brand-100",
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
