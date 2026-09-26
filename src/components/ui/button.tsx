import Link from "next/link";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-[13px]",
  md: "",
  lg: "min-h-11 px-5 text-[15px]",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(VARIANT[variant], SIZE[size], className);
}

type Common = { variant?: ButtonVariant; size?: ButtonSize; icon?: React.ElementType };

export function Button({
  variant,
  size,
  icon: Icon,
  className,
  children,
  type = "button",
  ...props
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...props}>
      {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  icon: Icon,
  className,
  children,
  href,
  ...props
}: Common & React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...props}>
      {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />}
      {children}
    </Link>
  );
}
