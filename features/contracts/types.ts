import type { EntityId, OwnerRef, Timestamps } from "@/features/shared/types/ids";

export type ContractStatus = "draft" | "active" | "completed" | "cancelled";

export type Contract = Timestamps & {
  id: EntityId;
  code: string;
  customerId: EntityId;
  quoteId?: EntityId;
  dealId?: EntityId;
  status: ContractStatus;
  value: number;
  startDate: string;
  endDate: string;
  owner: OwnerRef;
  terms?: string;
};

export type ContractInput = Omit<Contract, "id" | "createdAt" | "updatedAt" | "code"> & {
  code?: string;
};
