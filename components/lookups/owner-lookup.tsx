"use client";

import { Select } from "@/components/ui/select";
import { useOwners, ownerByIdSync } from "@/features/shared/api/owners";

type Props = {
  value?: string;
  onChange: (ownerId: string) => void;
  className?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
};

export function OwnerLookup({
  value,
  onChange,
  className,
  allowEmpty = true,
  emptyLabel = "Người phụ trách",
  disabled,
}: Props) {
  const owners = useOwners();
  return (
    <Select
      className={className}
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
