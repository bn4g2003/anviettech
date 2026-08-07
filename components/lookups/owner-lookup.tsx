"use client";

import { Select } from "@/components/ui/select";
import { useOwners, ownerByIdSync } from "@/features/shared/api/owners";

type Props = {
  value?: string;
  onChange: (ownerId: string) => void;
  className?: string;
  allowEmpty?: boolean;
};

export function OwnerLookup({ value, onChange, className, allowEmpty = true }: Props) {
  const owners = useOwners();
  return (
    <Select className={className} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
      {allowEmpty ? <option value="">Người phụ trách</option> : null}
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
