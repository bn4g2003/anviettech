"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { dealsService } from "@/features/deals/services/deals-service";
import type { Deal, DealInput, DealStage } from "@/features/deals/types";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";

export function useDeals(filters?: {
  query?: string;
  stage?: DealStage;
  ownerId?: string;
  customerId?: string;
  enabled?: boolean;
}) {
  const [rows, setRows] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: userLoading } = useCurrentUser();
  const canViewDeals = Boolean(user?.permissions.some(
    (permission) => (permission.module === "*" || permission.module === "deals") && permission.action === "view",
  ));

  const reload = useCallback(async () => {
    if (userLoading) return;
    if (!canViewDeals) {
      setRows([]);
      setLoading(false);
      return;
    }
    if (filters?.enabled === false) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await dealsService.list({
        search: filters?.query,
        status: filters?.stage,
        ownerId: filters?.ownerId,
        customerId: filters?.customerId,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading deals:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.query, filters?.stage, filters?.ownerId, filters?.customerId, filters?.enabled, canViewDeals, userLoading]);

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
