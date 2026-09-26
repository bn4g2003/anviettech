"use client";

import { cn } from "@/lib/cn";
import { Search, X } from "lucide-react";
import { type ChangeEvent, forwardRef } from "react";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    { value, onChange, placeholder = "Tìm kiếm...", className, autoFocus },
    ref,
  ) {
    return (
      <div className={cn("relative flex items-center shrink-0", className)}>
        <Search className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-muted" />
        <input
          ref={ref}
          type="text"
          autoFocus={autoFocus}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-7 w-full rounded-md border border-border bg-white pl-7 pr-6 text-xs outline-none placeholder:text-muted focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-muted hover:bg-muted-bg hover:text-foreground"
            title="Xóa tìm kiếm"
          >
            <X className="h-3 w-3" />
          </button>
        ) : null}
      </div>
    );
  },
);
