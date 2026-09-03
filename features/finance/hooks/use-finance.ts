"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { financeService, type RevenueDebtEntry, type RevenueReductionDebt } from "@/features/finance/services/finance-service";
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
  const [revenueEntries, setRevenueEntries] = useState<RevenueDebtEntry[]>([]);
  const [revenueReductions, setRevenueReductions] = useState<RevenueReductionDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const { all: customers } = useCustomers();

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, pay, revenue, reductions] = await Promise.all([
        financeService.listInvoices({
          search: filters?.query,
          status: filters?.invoiceStatus || filters?.status,
          customerId: filters?.customerId,
        }),
        financeService.listPayments({ search: filters?.query, customerId: filters?.customerId }),
        financeService.listRevenueEntries({ customerId: filters?.customerId }),
        financeService.listRevenueReductions({ customerId: filters?.customerId }),
      ]);
      setInvoices(Array.isArray(inv) ? inv : []);
      setPayments(Array.isArray(pay) ? pay : []);
      setRevenueEntries(Array.isArray(revenue) ? revenue : []);
      setRevenueReductions(Array.isArray(reductions) ? reductions : []);
    } catch (err) {
      console.error("Error loading finance data:", err);
      setInvoices([]);
      setPayments([]);
      setRevenueEntries([]);
      setRevenueReductions([]);
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
      if (inv.status === "cancelled") continue;
      const remaining = inv.amount - inv.paidAmount;
      if (remaining <= 0) continue;
      const cur = map.get(inv.customerId) ?? { debt: 0, invoiceCount: 0 };
      cur.debt += remaining;
      cur.invoiceCount += 1;
      map.set(inv.customerId, cur);
    }
    for (const entry of revenueEntries) {
      const remaining = Number(entry.totalAmount) - Number(entry.paidAmount);
      if (remaining <= 0) continue;
      const cur = map.get(entry.customerId) ?? { debt: 0, invoiceCount: 0 };
      cur.debt += remaining;
      cur.invoiceCount += 1;
      map.set(entry.customerId, cur);
    }
    for (const reduction of revenueReductions) {
      const cur = map.get(reduction.customerId);
      if (!cur) continue;
      cur.debt = Math.max(0, cur.debt - Number(reduction.amount));
      map.set(reduction.customerId, cur);
    }
    return [...map.entries()].map(([customerId, v]) => ({
      id: customerId,
      customerId,
      customerName: customers.find((c) => c.id === customerId)?.name ?? customerId,
      debt: v.debt,
      amount: v.debt,
      invoiceCount: v.invoiceCount,
    }));
  }, [invoices, revenueEntries, revenueReductions, customers]);

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
      Math.max(0,
        invoices.filter((i) => i.customerId === customerId && i.status !== "cancelled").reduce((s, i) => s + (i.amount - i.paidAmount), 0) +
        revenueEntries.filter((entry) => entry.customerId === customerId).reduce((s, entry) => s + Number(entry.totalAmount) - Number(entry.paidAmount), 0) -
        revenueReductions.filter((item) => item.customerId === customerId).reduce((s, item) => s + Number(item.amount), 0),
      ),
  };
}
