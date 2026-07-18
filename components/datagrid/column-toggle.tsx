"use client";

import { Button } from "@/components/ui/button";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Columns3 } from "lucide-react";

type ColumnToggleProps = {
  columns: { id: string; label: string }[];
  visibleIds: string[];
  onChange: (ids: string[]) => void;
};

export function ColumnToggle({ columns, visibleIds, onChange }: ColumnToggleProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline" size="sm">
          <Columns3 className="h-3.5 w-3.5" />
          Cột
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-50 min-w-[180px] rounded-md border border-border bg-white p-1 shadow-md"
        >
          {columns.map((col) => {
            const checked = visibleIds.includes(col.id);
            return (
              <DropdownMenu.CheckboxItem
                key={col.id}
                checked={checked}
                onCheckedChange={(next) => {
                  if (next) onChange([...visibleIds, col.id]);
                  else onChange(visibleIds.filter((id) => id !== col.id));
                }}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs outline-none data-[highlighted]:bg-muted-bg"
              >
                {col.label}
              </DropdownMenu.CheckboxItem>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
