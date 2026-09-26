"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { marketingService } from "@/features/marketing/services/marketing-service";
import type { Campaign, CampaignInput } from "@/features/marketing/types";

export function useMarketing(filters?: { query?: string; status?: string; channel?: string }) {
  const [rows, setRows] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      let list = await marketingService.list({ search: filters?.query, status: filters?.status });
      if (Array.isArray(list) && filters?.channel) {
        const channels = filters.channel.split(",").filter(Boolean);
        if (channels.length > 0) list = list.filter((c) => channels.includes(c.channel));
      }
      setRows(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error loading marketing campaigns:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.query, filters?.status, filters?.channel]);

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
    create: async (input: CampaignInput) => {
      const row = await marketingService.create(input);
      await reload();
      return row;
    },
    update: async (id: string, patch: Partial<CampaignInput>) => {
      const row = await marketingService.update(id, patch);
      await reload();
      return row;
    },
    remove: async (_deleteId: string) => undefined,
    convertLead: async () => {
      throw new Error("Dùng module Tiềm năng để chuyển đổi lead");
    },
  };
}

export function useMarketingAnalytics(params?: { campaignId?: string; source?: string }) {
  const [data, setData] = useState<import("@/features/marketing/types").MarketingAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await marketingService.getAnalytics(params);
      setData(res);
    } catch (err) {
      console.error("Error loading marketing analytics:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [params?.campaignId, params?.source]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, reload };
}

