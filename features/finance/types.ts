import type { EntityId, OwnerRef, Timestamps } from "@/features/shared/types/ids";

export type InvoiceStatus = "unpaid" | "partial" | "paid" | "cancelled";

export type Invoice = Timestamps & {
  id: EntityId;
  code: string;
  customerId: EntityId;
  orderId?: EntityId;
  contractId?: EntityId;
  status: InvoiceStatus;
  amount: number;
  paidAmount: number;
  dueDate: string;
  owner: OwnerRef;
};

export type PaymentMethod = "bank" | "cash" | "card" | "other";

export type Payment = Timestamps & {
  id: EntityId;
  code: string;
  invoiceId: EntityId;
  customerId: EntityId;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  owner: OwnerRef;
  note?: string;
};

export type InvoiceInput = Omit<Invoice, "id" | "createdAt" | "updatedAt" | "code" | "paidAmount" | "status"> & {
  code?: string;
  paidAmount?: number;
  status?: InvoiceStatus;
};

export type PaymentInput = Omit<Payment, "id" | "createdAt" | "updatedAt" | "code"> & {
  code?: string;
};
