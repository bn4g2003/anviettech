"use client";

import { useId, useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";
import { Input } from "./input";

export type SearchableSelectOption = {
  id: string;
  label: string;
  searchText?: string;
};

function normalizedText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLocaleLowerCase("vi")
    .trim();
}

export function filterSearchableOptions<T extends SearchableSelectOption>(options: T[], search: string) {
  const query = normalizedText(search);
  if (!query) return options;
  return options.filter((option) => normalizedText(`${option.label} ${option.searchText ?? ""}`).includes(query));
}

type SearchableSelectProps = {
  label: string;
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  className?: string;
  disabled?: boolean;
};

export function SearchableSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Chọn",
  emptyLabel = "Không có lựa chọn phù hợp",
  className,
  disabled,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const labelId = useId();
  const selected = options.find((option) => option.id === value);
  const filtered = useMemo(() => filterSearchableOptions(options, search), [options, search]);

  function select(nextValue: string) {
    onChange(nextValue);
    setSearch("");
    setOpen(false);
  }

  return (
    <div className={cn("space-y-1", className)}>
      <span id={labelId} className="text-xs font-medium text-foreground">
        {label}
      </span>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="mt-1 flex w-full justify-between gap-2 text-left font-normal"
            aria-labelledby={labelId}
          >
            <span className={cn("truncate", !selected && "text-muted")}>{selected?.label ?? placeholder}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={4}
            className="z-[60] w-[var(--radix-popover-trigger-width)] rounded-md border border-border bg-white p-1.5 shadow-lg"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <Input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full pl-7 text-xs"
                placeholder={`Tìm ${label.toLocaleLowerCase("vi")}...`}
                aria-label={`Tìm ${label.toLocaleLowerCase("vi")}`}
              />
            </div>
            <div role="listbox" aria-label={label} className="mt-1 max-h-52 overflow-y-auto">
              <button
                type="button"
                role="option"
                aria-selected={!value}
                onClick={() => select("")}
                className="flex w-full items-center rounded px-2 py-1.5 text-left text-xs text-muted outline-none hover:bg-surface focus:bg-surface"
              >
                Bỏ chọn
              </button>
              {filtered.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={option.id === value}
                  onClick={() => select(option.id)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-foreground outline-none hover:bg-surface focus:bg-surface"
                >
                  <Check className={cn("h-3.5 w-3.5 shrink-0", option.id === value ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0 truncate">{option.label}</span>
                </button>
              ))}
              {filtered.length === 0 ? (
                <p className="px-2 py-3 text-center text-xs text-muted">{emptyLabel}</p>
              ) : null}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
