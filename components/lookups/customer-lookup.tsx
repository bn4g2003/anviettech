"use client";

import { Select } from "@/components/ui/select";
import { useCustomers } from "@/features/customers/hooks/use-customers";

type Props = {
  value?: string;
  onChange: (customerId: string) => void;
  className?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
};

export function CustomerLookup({
  value,
  onChange,
  className,
  allowEmpty = true,
  emptyLabel = "Chọn khách hàng",
}: Props) {
  const { all } = useCustomers();
  return (
    <Select
      className={className}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    >
      {allowEmpty ? <option value="">{emptyLabel}</option> : null}
      {all.map((c) => (
        <option key={c.id} value={c.id}>
          {c.code} — {c.name}
        </option>
      ))}
    </Select>
  );
}
