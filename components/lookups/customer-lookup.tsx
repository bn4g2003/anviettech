"use client";

import { cn } from "@/lib/cn";
import { Select } from "@/components/ui/select";
import { MultiSelectFilter } from "@/components/datagrid/multi-select-filter";
import { useCustomers } from "@/features/customers/hooks/use-customers";

type Props = {
  value?: string;
  onChange: (customerId: string) => void;
  className?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
  multiple?: boolean;
};

export function CustomerLookup({
  value,
  onChange,
  className,
  allowEmpty = true,
  emptyLabel = "Chọn khách hàng",
  disabled,
  multiple = false,
}: Props) {
  const { all } = useCustomers();

  if (multiple) {
    return (
      <MultiSelectFilter
        title={emptyLabel}
        value={value}
        onChange={onChange}
        className={className}
        disabled={disabled}
        options={all.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }))}
      />
    );
  }

  const selected = all.find((c) => c.id === value);

  return (
    <Select
      className={cn("w-auto min-w-[130px] max-w-[200px] shrink-0 text-xs", className)}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      title={selected ? `${selected.code} — ${selected.name}` : undefined}
    >
      <option value="" disabled={!allowEmpty}>
        {emptyLabel}
      </option>
      {all.map((c) => (
        <option key={c.id} value={c.id}>
          {c.code} — {c.name}
        </option>
      ))}
    </Select>
  );
}
