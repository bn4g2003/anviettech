"use client";

import { Select } from "@/components/ui/select";
import { useProducts } from "@/features/products/hooks/use-products";

type Props = {
  value?: string;
  onChange: (productId: string) => void;
  className?: string;
  allowEmpty?: boolean;
};

export function ProductLookup({
  value,
  onChange,
  className,
  allowEmpty = true,
}: Props) {
  const { all } = useProducts();
  const active = all.filter((p) => p.status === "active");
  return (
    <Select
      className={className}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    >
      {allowEmpty ? <option value="">Chọn sản phẩm</option> : null}
      {active.map((p) => (
        <option key={p.id} value={p.id}>
          {p.sku} — {p.name}
        </option>
      ))}
    </Select>
  );
}
