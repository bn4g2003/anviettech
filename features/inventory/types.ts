import type { EntityId, OwnerRef, Timestamps } from "@/features/shared/types/ids";

export type StockMoveType = "in" | "out" | "transfer";
export type StockMoveReason = "purchase_receipt" | "customer_return" | "warranty_receipt" | "installation_issue" | "sales_issue" | "supplier_return" | "transfer";
export type StockMoveStatus = "draft" | "posted" | "cancelled";

export type StockMoveLine = {
  id: EntityId;
  productId: EntityId;
  productName: string;
  qty: number;
};

export type StockMove = Timestamps & {
  id: EntityId;
  code: string;
  type: StockMoveType;
  reason: StockMoveReason;
  status: StockMoveStatus;
  orderId?: EntityId;
  supplierId?: EntityId;
  customerId?: EntityId;
  projectId?: EntityId;
  warehouseFrom?: string;
  warehouseTo?: string;
  owner: OwnerRef;
  lines: StockMoveLine[];
  note?: string;
};

export type StockLevel = {
  productId: EntityId;
  qty: number;
};

export type StockMoveInput = Omit<StockMove, "id" | "createdAt" | "updatedAt" | "code" | "lines" | "owner" | "orderId"> & {
  code?: string;
  requestId?: string;
  lines: Omit<StockMoveLine, "id" | "productName">[];
};
