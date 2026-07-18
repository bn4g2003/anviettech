"use client";

import { useMemo } from "react";
import { useCrmStore } from "@/features/shared/store/crm-store";
import { dealsService } from "@/features/deals/services/deals-service";
import type { DealInput, DealStage } from "@/features/deals/types";

export function useDeals(filters?: {
  query?: string;
  stage?: DealStage;
  ownerId?: string;
  customerId?: string;
}) {
  const deals = useCrmStore((s) => s.deals);

  const rows = useMemo(() => {
    return dealsService.search(filters?.query ?? "", {
      stage: filters?.stage,
      ownerId: filters?.ownerId || undefined,
      customerId: filters?.customerId || undefined,
    });
  }, [deals, filters?.query, filters?.stage, filters?.ownerId, filters?.customerId]);

  return {
    rows,
    all: deals,
    getById: (id: string) => dealsService.getById(id),
    create: (input: DealInput, opts?: { createFollowup?: boolean }) =>
      dealsService.create(input, opts),
    update: (id: string, patch: Partial<DealInput>) => dealsService.update(id, patch),
    setStage: (id: string, stage: DealStage) => dealsService.setStage(id, stage),
    remove: (id: string) => dealsService.remove(id),
    removeMany: (ids: string[]) => dealsService.removeMany(ids),
    byCustomer: (customerId: string) => dealsService.byCustomer(customerId),
  };
}
