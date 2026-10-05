"use client";

import { Select } from "@/components/ui/select";
import { useProducts } from "@/features/products/hooks/use-products";
import type { ProductItemType } from "@/features/products/types";

type Props = {
  value?: string;
  onChange: (productId: string) => void;
  className?: string;
  allowEmpty?: boolean;
  itemType?: ProductItemType;
};

export function ProductLookup({
  value,
  onChange,
  className,
  allowEmpty = true,
  itemType,
}: Props) {
  const { all } = useProducts();
  const active = all.filter((p) => p.status === "active" && (!itemType || p.itemType === itemType));
  return (
    <Select
      className={className}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="" disabled={!allowEmpty}>
        Chọn sản phẩm
      </option>
      {active.map((p) => (
        <option key={p.id} value={p.id}>
          {p.sku} — {p.name}
        </option>
      ))}
    </Select>
  );
}
