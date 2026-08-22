"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ordersService } from "@/features/orders/services/orders-service";
import type { Order } from "@/features/orders/types";

export function useOrders(filters?: { query?: string; status?: string; customerId?: string }) {
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ordersService.list(filters);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading orders:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.query, filters?.status, filters?.customerId]);

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
    confirm: async (id: string, warehouseId: string) => {
      const result = await ordersService.confirm(id, warehouseId);
      await reload();
      return result.data;
    },
    remove: async (_deleteId: string) => undefined,
    removeMany: async (_ids: string[]) => undefined,
  };
}
