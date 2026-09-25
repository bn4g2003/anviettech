"use client";

import * as Popover from "@radix-ui/react-popover";
import {
  Children,
  ChangeEvent,
  SelectHTMLAttributes,
  isValidElement,
  useMemo,
  useState,
} from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";
import { Input } from "./input";
import { filterSearchableOptions } from "./searchable-select";

export type SelectOptionItem = {
  value: string;
  label: string;
  disabled: boolean;
};

function textFromNode(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  if (isValidElement<{ children?: unknown }>(node)) return textFromNode(node.props.children);
  return "";
}

/** Converts the existing native <option> API to searchable menu items. */
export function optionItemsFromChildren(children: React.ReactNode): SelectOptionItem[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ children?: React.ReactNode }>(child)) return [];

    if (child.type === "option") {
      const props = child.props as {
        value?: string | number;
        children?: React.ReactNode;
        disabled?: boolean;
      };
      return [{ value: String(props.value ?? ""), label: textFromNode(props.children), disabled: Boolean(props.disabled) }];
    }

    return optionItemsFromChildren(child.props.children);
  });
}

export type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children" | "onChange" | "value" | "multiple"
> & {
  children: React.ReactNode;
  value?: string | number | readonly string[];
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
};

/**
 * A searchable replacement for the old native Select. It intentionally keeps
 * its <option>, value and onChange interface so existing forms need no changes.
 */
export function Select({
  className,
  children,
  value,
  onChange,
  disabled,
  "aria-label": ariaLabel,
  title,
  id,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const options = useMemo(() => optionItemsFromChildren(children), [children]);
  const selectedValue = Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
  const selected = options.find((option) => option.value === selectedValue);
  const filteredOptions = useMemo(
    () => filterSearchableOptions(options.map((option) => ({ ...option, id: option.value })), search),
    [options, search],
  );
  const placeholder = options.find((option) => option.value === "")?.label ?? "Chọn";
  const accessibleName = ariaLabel ?? title ?? "lựa chọn";

  function select(nextValue: string) {
    if (nextValue === selectedValue) {
      setOpen(false);
      return;
    }
    onChange?.(
      {
        target: { value: nextValue },
        currentTarget: { value: nextValue },
      } as ChangeEvent<HTMLSelectElement>,
    );
    setSearch("");
    setOpen(false);
  }

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
          title={title}
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn("w-full justify-between gap-2 text-left font-normal", className)}
          aria-label={ariaLabel}
          aria-haspopup="listbox"
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
              placeholder={`Tìm ${accessibleName.toLocaleLowerCase("vi")}...`}
              aria-label={`Tìm ${accessibleName.toLocaleLowerCase("vi")}`}
            />
          </div>
          <div role="listbox" aria-label={accessibleName} className="mt-1 max-h-52 overflow-y-auto">
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === selectedValue}
                disabled={option.disabled}
                onClick={() => select(option.value)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-foreground outline-none hover:bg-surface focus:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className={cn("h-3.5 w-3.5 shrink-0", option.value === selectedValue ? "opacity-100" : "opacity-0")} />
                <span className="min-w-0 truncate">{option.label}</span>
              </button>
            ))}
            {filteredOptions.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-muted">Không có lựa chọn phù hợp</p>
            ) : null}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
