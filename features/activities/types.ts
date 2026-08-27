import type { EntityId, OwnerRef, Timestamps } from "@/features/shared/types/ids";

export type ActivityType = "call" | "email" | "meeting" | "note";

export type Activity = Timestamps & {
  id: EntityId;
  type: ActivityType;
  subject: string;
  content?: string;
  occurredAt: string;
  owner: OwnerRef;
  customerId?: EntityId;
  dealId?: EntityId;
};

export type ActivityInput = Omit<Activity, "id" | "createdAt" | "updatedAt" | "owner">;
