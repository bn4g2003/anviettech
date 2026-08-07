"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { DEAL_STAGE_META, type DealStage } from "@/features/deals/types";

type ApiAnalytics = {
  pipelineByStage: { stage: string; count: number; value: number }[];
  revenuePaid: number;
  receivables: number;
  overdueTasks: number;
  topCustomers: { id: string; name: string; revenue: number }[];
  topProducts: { id: string; name: string; qty: number; revenue: number }[];
  lowStock: { productId: string; name: string; sku: string; qty: number; minStock: number }[];
};

export function useAnalytics() {
  const [raw, setRaw] = useState<ApiAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFetch<ApiAnalytics>("/api/v1/analytics");
      setRaw(result.data);
    } catch {
      setRaw(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const pipelineByStage = raw?.pipelineByStage ?? [];
  const won = pipelineByStage.find((s) => s.stage === "won")?.count ?? 0;
  const lost = pipelineByStage.find((s) => s.stage === "lost")?.count ?? 0;
  const closed = won + lost;
  const pipelineValue = pipelineByStage
    .filter((s) => s.stage !== "won" && s.stage !== "lost")
    .reduce((sum, s) => sum + s.value, 0);

  const stages = Object.keys(DEAL_STAGE_META) as DealStage[];
  const dealsByStage = stages.map((stage) => {
    const row = pipelineByStage.find((s) => s.stage === stage);
    return {
      stage,
      label: DEAL_STAGE_META[stage].label,
      count: row?.count ?? 0,
      value: row?.value ?? 0,
    };
  });

  const topCustomers = (raw?.topCustomers ?? []).map((c) => ({
    customerId: c.id,
    name: c.name,
    revenue: c.revenue,
  }));

  const categoryRevenue = (raw?.topProducts ?? []).slice(0, 6).map((p, i) => ({
    category: p.name,
    revenue: p.revenue,
    color: ["#2563eb", "#16a34a", "#ca8a04", "#dc2626", "#7c3aed", "#0891b2"][i % 6],
  }));

  const replenishmentForecast = (raw?.lowStock ?? []).map((item) => ({
    productId: item.productId,
    name: item.name,
    category: item.sku,
    stock: item.qty,
    forecastQty: Math.max(item.minStock - item.qty, 0),
    coverageDays: item.qty > 0 ? Math.round((item.qty / Math.max(item.minStock, 1)) * 30) : 0,
  }));

  const now = new Date();
  const monthLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const revenueForecast = [
    { month: monthLabel, actual: raw?.revenuePaid ?? 0, forecast: (raw?.revenuePaid ?? 0) * 1.1 },
  ];

  return {
    loading,
    reload,
    revenueThisMonth: raw?.revenuePaid ?? 0,
    pipelineValue,
    winRate: closed === 0 ? 0 : Math.round((won / closed) * 100),
    totalDebt: raw?.receivables ?? 0,
    lowStockCount: raw?.lowStock?.length ?? 0,
    openTasks: raw?.overdueTasks ?? 0,
    dealsByStage,
    topCustomers,
    revenueByMonth: revenueForecast.map((r) => ({ month: r.month, amount: r.actual ?? 0 })),
    revenueForecast,
    categoryRevenue,
    replenishmentForecast,
  };
}
