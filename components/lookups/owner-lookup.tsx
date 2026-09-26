"use client";

import { cn } from "@/lib/cn";
import { Select } from "@/components/ui/select";
import { MultiSelectFilter } from "@/components/datagrid/multi-select-filter";
import { useOwners, ownerByIdSync } from "@/features/shared/api/owners";

type Props = {
  value?: string;
  onChange: (ownerId: string) => void;
  className?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
  multiple?: boolean;
};

export function OwnerLookup({
  value,
  onChange,
  className,
  allowEmpty = true,
  emptyLabel = "Người phụ trách",
  disabled,
  multiple = false,
}: Props) {
  const owners = useOwners();

  if (multiple) {
    return (
      <MultiSelectFilter
        title={emptyLabel}
        value={value}
        onChange={onChange}
        className={className}
        disabled={disabled}
        options={owners.map((o) => ({ value: o.id, label: o.name }))}
      />
    );
  }
  return (
    <Select
      className={cn("w-auto min-w-[130px] max-w-[190px] shrink-0 text-xs", className)}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {allowEmpty ? <option value="">{emptyLabel}</option> : null}
      {!allowEmpty && !value ? <option value="">Chọn người phụ trách</option> : null}
      {owners.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </Select>
  );
}

export function ownerById(id: string) {
  // sync fallback for forms; prefer useOwners in components
  return ownerByIdSync(id, []);
}
