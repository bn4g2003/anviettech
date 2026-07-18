import type { EntityId, OwnerRef, Timestamps } from "@/features/shared/types/ids";

export type OrderStatus = "draft" | "confirmed" | "fulfilled" | "cancelled";

export type OrderLine = {
  id: EntityId;
  productId: EntityId;
  productName: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type Order = Timestamps & {
  id: EntityId;
  code: string;
  customerId: EntityId;
  contractId?: EntityId;
  quoteId?: EntityId;
  status: OrderStatus;
  owner: OwnerRef;
  lines: OrderLine[];
  total: number;
};

export type OrderInput = Omit<
  Order,
  "id" | "createdAt" | "updatedAt" | "code" | "total" | "lines"
> & {
  code?: string;
  lines: Omit<OrderLine, "id" | "lineTotal" | "productName">[];
};
