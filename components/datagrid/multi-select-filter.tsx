"use client";

import * as Popover from "@radix-ui/react-popover";
import {
  Children,
  isValidElement,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { filterSearchableOptions } from "@/components/ui/searchable-select";
import { optionItemsFromChildren } from "@/components/ui/select";

export type MultiSelectOption = {
  value: string;
  label: string;
  badge?: ReactNode;
  disabled?: boolean;
};

export type MultiSelectFilterProps = {
  title?: string;
  placeholder?: string;
  value?: string | string[];
  onChange: (value: string, selectedValues: string[]) => void;
  options?: MultiSelectOption[];
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
  showSelectAll?: boolean;
  align?: "start" | "end" | "center";
  id?: string;
  "aria-label"?: string;
};

function textFromNode(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  if (isValidElement<{ children?: unknown }>(node)) return textFromNode(node.props.children);
  return "";
}

export function parseOptionsFromChildren(children: ReactNode): {
  titleFromPlaceholder?: string;
  options: MultiSelectOption[];
} {
  const items = optionItemsFromChildren(children);
  let titleFromPlaceholder: string | undefined;
  const options: MultiSelectOption[] = [];

  for (const item of items) {
    if (item.value === "") {
      if (!titleFromPlaceholder && item.label) titleFromPlaceholder = item.label;
    } else {
      options.push({
        value: item.value,
        label: item.label || item.value,
        disabled: item.disabled,
      });
    }
  }

  return { titleFromPlaceholder, options };
}

export function MultiSelectFilter({
  title,
  placeholder,
  value,
  onChange,
  options,
  children,
  className,
  disabled,
  searchable,
  showSelectAll = true,
  align = "start",
  id,
  "aria-label": ariaLabel,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { resolvedTitle, resolvedOptions } = useMemo(() => {
    let t = title || placeholder;
    let opts = options ? [...options] : [];

    if (children) {
      const parsed = parseOptionsFromChildren(children);
      if (!t && parsed.titleFromPlaceholder) t = parsed.titleFromPlaceholder;
      if (opts.length === 0) opts = parsed.options;
    }

    return {
      resolvedTitle: t || "Bộ lọc",
      resolvedOptions: opts,
    };
  }, [title, placeholder, options, children]);

  const selectedValues = useMemo(() => {
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value === "string" && value.trim()) {
      return value.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [value]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return resolvedOptions;
    return filterSearchableOptions(
      resolvedOptions.map((o) => ({ ...o, id: o.value })),
      search,
    );
  }, [resolvedOptions, search]);

  const shouldShowSearch = searchable ?? resolvedOptions.length >= 6;

  function toggleOption(optVal: string) {
    const next = selectedValues.includes(optVal)
      ? selectedValues.filter((v) => v !== optVal)
      : [...selectedValues, optVal];
    onChange(next.join(","), next);
  }

  function handleSelectAll() {
    const availableValues = filteredOptions.filter((o) => !o.disabled).map((o) => o.value);
    const next = Array.from(new Set([...selectedValues, ...availableValues]));
    onChange(next.join(","), next);
  }

  function handleClearAll(e?: MouseEvent) {
    e?.stopPropagation();
    onChange("", []);
  }

  const selectedCount = selectedValues.length;
  const isAllSelected = resolvedOptions.length > 0 && selectedCount === resolvedOptions.length;

  // Selected item label for single selection display
  const singleSelectedItem = selectedCount === 1
    ? resolvedOptions.find((o) => o.value === selectedValues[0])
    : null;

  const tooltipText = useMemo(() => {
    if (selectedCount === 0) return resolvedTitle;
    const names = selectedValues
      .map((val) => resolvedOptions.find((o) => o.value === val)?.label || val)
      .join(", ");
    return `${resolvedTitle}: ${names}`;
  }, [resolvedTitle, selectedCount, selectedValues, resolvedOptions]);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch("");
      }}
    >
      <Popover.Trigger asChild>
        <Button
          id={id}
          variant="outline"
          size="sm"
          disabled={disabled}
          title={tooltipText}
          aria-label={ariaLabel || resolvedTitle}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "h-8 w-auto min-w-[110px] max-w-[240px] shrink-0 justify-between gap-1.5 px-2.5 text-left text-xs font-normal transition-colors",
            selectedCount > 0 && "border-primary/40 bg-primary/5 text-primary font-medium",
            className,
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
            {selectedCount === 0 ? (
              <span className="truncate text-muted">{resolvedTitle}</span>
            ) : selectedCount === 1 && singleSelectedItem ? (
              <span className="truncate">
                <span className="text-muted">{resolvedTitle}: </span>
                <span className="font-medium text-foreground">{singleSelectedItem.label}</span>
              </span>
            ) : (
              <>
                <span className="truncate text-foreground font-medium">{resolvedTitle}</span>
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {selectedCount}
                </span>
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            {selectedCount > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClearAll}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClearAll();
                  }
                }}
                className="flex h-4 w-4 items-center justify-center rounded-full text-muted hover:bg-black/10 hover:text-foreground"
                title="Bỏ lọc"
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
          </div>
        </Button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align={align}
          sideOffset={4}
          className="z-[60] min-w-[220px] w-[max(var(--radix-popover-trigger-width),220px)] max-w-[340px] rounded-md border border-border bg-white p-1.5 shadow-lg"
        >
          {/* Popover Header with Title and Quick Actions */}
          <div className="flex items-center justify-between border-b border-border/60 px-2 py-1 text-[11px] text-muted">
            <span className="font-medium text-foreground">
              {resolvedTitle} ({selectedCount}/{resolvedOptions.length})
            </span>
            <div className="flex items-center gap-2">
              {showSelectAll && !isAllSelected && resolvedOptions.length > 1 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="font-medium text-primary hover:underline cursor-pointer"
                >
                  Chọn hết
                </button>
              )}
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleClearAll()}
                  className="font-medium text-danger hover:underline cursor-pointer"
                >
                  Bỏ chọn
                </button>
              )}
            </div>
          </div>

          {/* Search box if needed */}
          {shouldShowSearch && (
            <div className="relative mt-1.5 mb-1 px-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <Input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Tìm ${resolvedTitle.toLowerCase()}...`}
                className="h-7 w-full pl-7 text-xs"
              />
            </div>
          )}

          {/* Checkable List */}
          <div role="listbox" aria-label={resolvedTitle} className="mt-1 max-h-56 overflow-y-auto">
            {filteredOptions.map((opt) => {
              const isChecked = selectedValues.includes(opt.value);
              return (
                <div
                  key={opt.value}
                  role="checkbox"
                  aria-checked={isChecked}
                  tabIndex={opt.disabled ? -1 : 0}
                  onClick={() => !opt.disabled && toggleOption(opt.value)}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && !opt.disabled) {
                      e.preventDefault();
                      toggleOption(opt.value);
                    }
                  }}
                  className={cn(
                    "group flex cursor-pointer select-none items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors outline-none",
                    isChecked ? "bg-primary/5 font-medium text-foreground" : "text-foreground hover:bg-surface",
                    opt.disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      isChecked
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-white group-hover:border-primary/50",
                    )}
                  >
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                  {opt.badge}
                </div>
              );
            })}

            {filteredOptions.length === 0 && (
              <p className="px-2 py-3 text-center text-xs text-muted">Không có lựa chọn phù hợp</p>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
