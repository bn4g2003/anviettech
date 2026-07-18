"use client";

import { Select } from "@/components/ui/select";
import { useDeals } from "@/features/deals/hooks/use-deals";

type Props = {
  value?: string;
  onChange: (dealId: string) => void;
  customerId?: string;
  className?: string;
  allowEmpty?: boolean;
};

export function DealLookup({
  value,
  onChange,
  customerId,
  className,
  allowEmpty = true,
}: Props) {
  const { all } = useDeals();
  const rows = customerId ? all.filter((d) => d.customerId === customerId) : all;
  return (
    <Select
      className={className}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    >
      {allowEmpty ? <option value="">Chọn cơ hội (tuỳ chọn)</option> : null}
      {rows.map((d) => (
        <option key={d.id} value={d.id}>
          {d.code} — {d.title}
        </option>
      ))}
    </Select>
  );
}
