import type { EntityId, OwnerRef, Timestamps } from "@/features/shared/types/ids";

export type StockMoveType = "in" | "out" | "transfer";
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
  status: StockMoveStatus;
  orderId?: EntityId;
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

export type StockMoveInput = Omit<StockMove, "id" | "createdAt" | "updatedAt" | "code" | "lines"> & {
  code?: string;
  lines: Omit<StockMoveLine, "id" | "productName">[];
};
