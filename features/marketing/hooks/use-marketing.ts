"use client";

import { useMemo } from "react";
import { useCrmStore } from "@/features/shared/store/crm-store";
import { marketingService } from "@/features/marketing/services/marketing-service";
import type { CampaignInput } from "@/features/marketing/types";

export function useMarketing(filters?: { query?: string; status?: string; channel?: string }) {
  const campaigns = useCrmStore((s) => s.campaigns);

  const rows = useMemo(() => {
    return marketingService.search(filters?.query ?? "", {
      status: filters?.status || undefined,
      channel: filters?.channel || undefined,
    });
  }, [campaigns, filters?.query, filters?.status, filters?.channel]);

  return {
    rows,
    all: campaigns,
    create: (input: CampaignInput) => marketingService.create(input),
    update: (id: string, patch: Partial<CampaignInput>) => marketingService.update(id, patch),
    remove: (id: string) => marketingService.remove(id),
    getById: (id: string) => marketingService.getById(id),
    convertLead: marketingService.convertLeadToCustomer.bind(marketingService),
  };
}
