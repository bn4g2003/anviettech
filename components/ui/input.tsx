import { cn } from "@/lib/cn";
import { InputHTMLAttributes, forwardRef } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-7 w-full rounded-md border border-border bg-white px-2.5 text-sm outline-none placeholder:text-muted focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300 disabled:bg-muted-bg",
          className,
        )}
        {...props}
      />
    );
  },
);
