"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { quotesService } from "@/features/quotes/services/quotes-service";
import type { Quote, QuoteInput } from "@/features/quotes/types";

export function useQuotes(filters?: { query?: string; status?: string; customerId?: string }) {
  const [rows, setRows] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await quotesService.list({ search: filters?.query, status: filters?.status, customerId: filters?.customerId }));
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
    create: async (input: QuoteInput) => {
      const row = await quotesService.create(input);
      await reload();
      return row;
    },
    update: async (id: string, patch: Partial<QuoteInput>) => {
      const row = await quotesService.update(id, patch);
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
