"use client";

import { OWNERS } from "@/features/shared/seed";
import { Select } from "@/components/ui/select";

type Props = {
  value?: string;
  onChange: (ownerId: string) => void;
  className?: string;
  allowEmpty?: boolean;
};

export function OwnerLookup({ value, onChange, className, allowEmpty = true }: Props) {
  return (
    <Select
      className={className}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    >
      {allowEmpty ? <option value="">Người phụ trách</option> : null}
      {OWNERS.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </Select>
  );
}

export function ownerById(id: string) {
  return OWNERS.find((o) => o.id === id) ?? OWNERS[0];
}
