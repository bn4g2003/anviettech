"use client";

import { cn } from "@/lib/cn";
import { ReactNode } from "react";

type FilterBarProps = {
  filters?: ReactNode;
  search?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function FilterBar({ filters, search, actions, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex h-[var(--filter-height)] shrink-0 items-center gap-2 border-b border-border bg-white px-3",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
        {filters}
        {search}
      </div>
      <div className="flex shrink-0 items-center gap-1">{actions}</div>
    </div>
  );
}
