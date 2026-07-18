"use client";

import { useMemo } from "react";
import { useCrmStore } from "@/features/shared/store/crm-store";
import { financeService } from "@/features/finance/services/finance-service";
import type { PaymentInput } from "@/features/finance/types";
import { customersService } from "@/features/customers/services/customers-service";

export function useFinance(filters?: { query?: string; invoiceStatus?: string }) {
  const invoices = useCrmStore((s) => s.invoices);
  const payments = useCrmStore((s) => s.payments);

  const filteredInvoices = useMemo(() => {
    const q = (filters?.query ?? "").trim().toLowerCase();
    return invoices.filter((i) => {
      if (filters?.invoiceStatus && i.status !== filters.invoiceStatus) return false;
      if (!q) return true;
      return i.code.toLowerCase().includes(q);
    });
  }, [invoices, filters?.query, filters?.invoiceStatus]);

  const debts = useMemo(() => {
    return financeService.debtByCustomer().map((d) => ({
      ...d,
      id: d.customerId,
      customerName: customersService.getById(d.customerId)?.name ?? d.customerId,
    }));
  }, [invoices, payments]);

  return {
    invoices: filteredInvoices,
    allInvoices: invoices,
    payments,
    debts,
    recordPayment: (input: PaymentInput) => financeService.recordPayment(input),
    removeInvoice: (id: string) => financeService.removeInvoice(id),
    getDebt: (customerId: string) => financeService.getCustomerDebt(customerId),
    getById: (id: string) => financeService.getInvoice(id),
    getPaymentById: (id: string) => payments.find((p) => p.id === id),
  };
}
