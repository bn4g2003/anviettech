import { cn } from "@/lib/cn";
import { SelectHTMLAttributes, forwardRef } from "react";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "h-7 rounded-md border border-border bg-white px-2 text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300 disabled:bg-muted-bg",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);
