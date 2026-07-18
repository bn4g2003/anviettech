import { cn } from "@/lib/cn";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-fg hover:bg-neutral-800 border-transparent",
  secondary: "bg-muted-bg text-foreground hover:bg-neutral-200 border-transparent",
  ghost: "bg-transparent hover:bg-muted-bg border-transparent text-foreground",
  danger: "bg-danger text-white hover:bg-red-700 border-transparent",
  outline: "bg-white border-border text-foreground hover:bg-muted-bg",
};

const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-xs gap-1",
  md: "h-8 px-3 text-sm gap-1.5",
  icon: "h-7 w-7 p-0",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "secondary", size = "sm", type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center rounded-md border font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
