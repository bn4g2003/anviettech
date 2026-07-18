import type { EntityId, OwnerRef, Timestamps } from "@/features/shared/types/ids";

export type CustomerType = "company" | "individual";
export type CustomerStatus = "active" | "inactive" | "lead";

export type Customer = Timestamps & {
  id: EntityId;
  code: string;
  name: string;
  type: CustomerType;
  phone: string;
  email: string;
  address: string;
  owner: OwnerRef;
  source: string;
  status: CustomerStatus;
  campaignId?: EntityId;
  notes?: string;
  contactName?: string;
  logoColor?: string;
};

export type CustomerInput = Omit<Customer, "id" | "createdAt" | "updatedAt" | "code"> & {
  code?: string;
};
