import type { EntityId, OwnerRef, Timestamps } from "@/features/shared/types/ids";

export type QuoteStatus = "draft" | "sent" | "approved" | "rejected" | "expired";

export type QuoteLine = {
  id: EntityId;
  productId: EntityId;
  productName: string;
  qty: number;
  unitPrice: number;
  discountPercent: number;
  vatPercent: number;
  lineTotal: number;
};

export type Quote = Timestamps & {
  id: EntityId;
  code: string;
  customerId: EntityId;
  dealId?: EntityId;
  status: QuoteStatus;
  validUntil: string;
  owner: OwnerRef;
  terms?: string;
  lines: QuoteLine[];
  subtotal: number;
  total: number;
};

export type QuoteInput = Omit<
  Quote,
  "id" | "createdAt" | "updatedAt" | "code" | "subtotal" | "total" | "lines"
> & {
  code?: string;
  lines: Omit<QuoteLine, "id" | "lineTotal" | "productName">[];
};
