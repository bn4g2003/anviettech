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
  content?: string | null;
  landingPageUrl?: string | null;
};

export type CampaignInput = Omit<Campaign, "id" | "createdAt" | "updatedAt" | "code"> & {
  code?: string;
};

export type MarketingCustomer = {
  id: string;
  code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  campaignId?: string | null;
  campaignName?: string | null;
  ownerName?: string | null;
  dealsCount: number;
  wonDealsCount: number;
  lostDealsCount: number;
  totalDealValue: number;
  wonDealValue: number;
  createdAt: string;
};

export type MarketingFunnelStep = {
  id: string;
  label: string;
  count: number;
  value: number;
  secondary?: string;
};

export type MarketingAnalyticsOverview = {
  totalCustomers: number;
  totalLeads: number;
  convertedLeads: number;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  openDeals: number;
  winRate: number;
  lossRate: number;
  totalRevenue: number;
  funnel: MarketingFunnelStep[];
  customers: MarketingCustomer[];
};
