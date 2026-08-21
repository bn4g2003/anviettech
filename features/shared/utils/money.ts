export function formatVnd(amount?: number | null): string {
  const val = typeof amount === "number" && !isNaN(amount) ? amount : (Number(amount) || 0);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(val);
}

export function calcLineTotal(
  qty: number,
  unitPrice: number,
  discountPercent = 0,
  vatPercent = 0,
): number {
  const base = qty * unitPrice;
  const afterDiscount = base * (1 - discountPercent / 100);
  return Math.round(afterDiscount * (1 + vatPercent / 100));
}

export function sumAmounts(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}
