import type { EntityId, OwnerRef, Timestamps } from "@/features/shared/types/ids";

export type CampaignStatus = "draft" | "running" | "paused" | "completed";
export type CampaignChannel = "email" | "social" | "ads" | "event" | "other";

export type Campaign = Timestamps & {
  id: EntityId;
  code: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  budget: number;
  spent: number;
  leadsCount: number;
  owner: OwnerRef;
  startDate: string;
  endDate: string;
};

export type CampaignInput = Omit<Campaign, "id" | "createdAt" | "updatedAt" | "code"> & {
  code?: string;
};
