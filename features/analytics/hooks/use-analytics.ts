"use client";

import { useMemo } from "react";
import { useCrmStore } from "@/features/shared/store/crm-store";
import { analyticsService } from "@/features/analytics/services/analytics-service";

export function useAnalytics() {
  const customers = useCrmStore((s) => s.customers);
  const deals = useCrmStore((s) => s.deals);
  const invoices = useCrmStore((s) => s.invoices);
  const payments = useCrmStore((s) => s.payments);
  const orders = useCrmStore((s) => s.orders);
  const products = useCrmStore((s) => s.products);
  const tasks = useCrmStore((s) => s.tasks);
  const stockLevels = useCrmStore((s) => s.stockLevels);

  return useMemo(
    () => analyticsService.snapshot(),
    [customers, deals, invoices, payments, orders, products, tasks, stockLevels],
  );
}
