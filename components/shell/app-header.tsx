"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown, Plus } from "lucide-react";
import { ReactNode } from "react";

type AppHeaderProps = {
  moduleLabel: string;
  viewLabel?: string;
  onCreate?: () => void;
  createLabel?: string;
  secondaryAction?: ReactNode;
  viewModes?: ReactNode;
};

export function AppHeader({
  moduleLabel,
  viewLabel = "Danh sách",
  onCreate,
  createLabel = "Tạo",
  secondaryAction,
  viewModes,
}: AppHeaderProps) {
  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center justify-between border-b border-border bg-white px-3">
      <div className="flex items-center gap-1 text-sm">
        <span className="font-medium">{moduleLabel}</span>
        <span className="text-muted">/</span>
        {viewModes ?? (
          <button type="button" className="inline-flex items-center gap-0.5 font-medium">
            {viewLabel}
            <ChevronDown className="h-3.5 w-3.5 text-muted" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {secondaryAction}
        {onCreate ? (
          <Button variant="primary" size="sm" onClick={onCreate}>
            <Plus className="h-3.5 w-3.5" />
            {createLabel}
          </Button>
        ) : null}
      </div>
    </header>
  );
}
