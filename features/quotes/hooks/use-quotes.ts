"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { quotesService } from "@/features/quotes/services/quotes-service";
import type { Quote, QuoteInput } from "@/features/quotes/types";

export function useQuotes(filters?: { query?: string; status?: string; customerId?: string; page?: number; pageSize?: number; enabled?: boolean }) {
  const [rows, setRows] = useState<Quote[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (filters?.enabled === false) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await quotesService.list({ search: filters?.query, status: filters?.status, customerId: filters?.customerId, page: filters?.page, pageSize: filters?.pageSize });
      setRows(data.rows);
      setTotal(data.total);
    } catch (err) {
      console.error("Error loading quotes:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.query, filters?.status, filters?.customerId, filters?.page, filters?.pageSize, filters?.enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  return {
    rows,
    all: rows,
    total,
    loading,
    reload,
    getById: (id: string) => byId.get(id),
    create: async (input: QuoteInput) => {
      const row = await quotesService.create(input);
      await reload();
      return row;
    },
    update: async (id: string, patch: Partial<QuoteInput>, currentStatus?: Quote["status"]) => {
      const row = await quotesService.update(id, patch, currentStatus);
      await reload();
      return row;
    },
    remove: async (id: string) => {
      await quotesService.remove(id);
      await reload();
    },
    removeMany: async (ids: string[]) => {
      await quotesService.removeMany(ids);
      await reload();
    },
    approve: async (id: string) => {
      const result = await quotesService.approve(id);
      await reload();
      return result.data;
    },
    send: async (id: string) => {
      await quotesService.send(id);
      await reload();
    },
  };
}
