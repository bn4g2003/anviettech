"use client";

import { useMemo } from "react";
import { useCrmStore } from "@/features/shared/store/crm-store";
import { quotesService } from "@/features/quotes/services/quotes-service";
import type { QuoteInput } from "@/features/quotes/types";
import { approveQuote } from "@/features/shared/workflows/sales-workflows";

export function useQuotes(filters?: { query?: string; status?: string; customerId?: string }) {
  const quotes = useCrmStore((s) => s.quotes);

  const rows = useMemo(() => {
    return quotesService.search(filters?.query ?? "", {
      status: filters?.status || undefined,
      customerId: filters?.customerId || undefined,
    });
  }, [quotes, filters?.query, filters?.status, filters?.customerId]);

  return {
    rows,
    all: quotes,
    getById: (id: string) => quotesService.getById(id),
    create: (input: QuoteInput) => quotesService.create(input),
    update: (id: string, patch: Partial<QuoteInput>) => quotesService.update(id, patch),
    remove: (id: string) => quotesService.remove(id),
    removeMany: (ids: string[]) => quotesService.removeMany(ids),
    approve: (id: string) => approveQuote(id),
  };
}
