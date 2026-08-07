"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { financeService } from "@/features/finance/services/finance-service";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import type { Invoice, Payment, PaymentInput } from "@/features/finance/types";

export type DebtRow = {
  id: string;
  customerId: string;
  customerName: string;
  debt: number;
  amount: number;
  invoiceCount: number;
};

export function useFinance(filters?: {
  query?: string;
  status?: string;
  customerId?: string;
  invoiceStatus?: string;
}) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { all: customers } = useCustomers();

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, pay] = await Promise.all([
        financeService.listInvoices({
          search: filters?.query,
          status: filters?.invoiceStatus || filters?.status,
          customerId: filters?.customerId,
        }),
        financeService.listPayments({ search: filters?.query, customerId: filters?.customerId }),
      ]);
      setInvoices(inv);
      setPayments(pay);
    } finally {
      setLoading(false);
    }
  }, [filters?.query, filters?.status, filters?.customerId, filters?.invoiceStatus]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const debts: DebtRow[] = useMemo(() => {
    const map = new Map<string, { debt: number; invoiceCount: number }>();
    for (const inv of invoices) {
      const remaining = inv.amount - inv.paidAmount;
      if (remaining <= 0) continue;
      const cur = map.get(inv.customerId) ?? { debt: 0, invoiceCount: 0 };
      cur.debt += remaining;
      cur.invoiceCount += 1;
      map.set(inv.customerId, cur);
    }
    return [...map.entries()].map(([customerId, v]) => ({
      id: customerId,
      customerId,
      customerName: customers.find((c) => c.id === customerId)?.name ?? customerId,
      debt: v.debt,
      amount: v.debt,
      invoiceCount: v.invoiceCount,
    }));
  }, [invoices, customers]);

  const byId = useMemo(() => new Map(invoices.map((i) => [i.id, i])), [invoices]);

  return {
    invoices,
    allInvoices: invoices,
    payments,
    debts,
    loading,
    reload,
    getById: (id: string) => byId.get(id),
    recordPayment: async (input: PaymentInput) => {
      await financeService.recordPayment(input);
      await reload();
    },
    getCustomerDebt: (customerId: string) =>
      invoices.filter((i) => i.customerId === customerId).reduce((s, i) => s + (i.amount - i.paidAmount), 0),
  };
}
