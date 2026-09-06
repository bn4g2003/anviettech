"use client";

import { cn } from "@/lib/cn";
import { Select } from "@/components/ui/select";
import { useCustomers } from "@/features/customers/hooks/use-customers";

type Props = {
  value?: string;
  onChange: (customerId: string) => void;
  className?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
};

export function CustomerLookup({
  value,
  onChange,
  className,
  allowEmpty = true,
  emptyLabel = "Chọn khách hàng",
  disabled,
}: Props) {
  const { all } = useCustomers();
  const selected = all.find((c) => c.id === value);

  return (
    <Select
      className={cn("w-36 max-w-[150px] truncate text-xs", className)}
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
