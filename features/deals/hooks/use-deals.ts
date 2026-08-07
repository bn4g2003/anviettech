"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { dealsService } from "@/features/deals/services/deals-service";
import type { Deal, DealInput, DealStage } from "@/features/deals/types";

export function useDeals(filters?: {
  query?: string;
  stage?: DealStage;
  ownerId?: string;
  customerId?: string;
}) {
  const [rows, setRows] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setRows(
        await dealsService.list({
          search: filters?.query,
          status: filters?.stage,
          ownerId: filters?.ownerId,
          customerId: filters?.customerId,
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [filters?.query, filters?.stage, filters?.ownerId, filters?.customerId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  return {
    rows,
    all: rows,
    loading,
    reload,
    getById: (id: string) => byId.get(id),
    create: async (input: DealInput) => {
      const row = await dealsService.create(input);
      await reload();
      return row;
    },
    update: async (id: string, patch: Partial<DealInput>) => {
      const row = await dealsService.update(id, patch);
      await reload();
      return row;
    },
    setStage: async (id: string, stage: DealStage, reason?: string) => {
      const row = await dealsService.setStage(id, stage, reason);
      await reload();
      return row;
    },
    remove: async (id: string) => {
      await dealsService.remove(id);
      await reload();
    },
    removeMany: async (ids: string[]) => {
      await dealsService.removeMany(ids);
      await reload();
    },
    byCustomer: (customerId: string) => rows.filter((d) => d.customerId === customerId),
  };
}
