import type { Invoice, InvoiceInput, Payment, PaymentInput } from "@/features/finance/types";
import { crmRepository } from "@/features/shared/repository/crm-repository";
import { createId } from "@/features/shared/utils/id";
import { nowIso } from "@/features/shared/utils/date";

function nextInvoiceCode(rows: Invoice[]): string {
  const max = rows.reduce((acc, r) => {
    const n = Number(r.code.replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `HDON-${String(max + 1).padStart(4, "0")}`;
}

function nextPaymentCode(rows: Payment[]): string {
  const max = rows.reduce((acc, r) => {
    const n = Number(r.code.replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `TT-${String(max + 1).padStart(4, "0")}`;
}

function invoiceStatus(amount: number, paid: number): Invoice["status"] {
  if (paid <= 0) return "unpaid";
  if (paid >= amount) return "paid";
  return "partial";
}

export const financeService = {
  listInvoices(): Invoice[] {
    return crmRepository.listInvoices();
  },

  listPayments(): Payment[] {
    return crmRepository.listPayments();
  },

  getInvoice(id: string): Invoice | undefined {
    return crmRepository.listInvoices().find((i) => i.id === id);
  },

  createInvoice(input: InvoiceInput): Invoice {
    const rows = crmRepository.listInvoices();
    const now = nowIso();
    const paidAmount = input.paidAmount ?? 0;
    const row: Invoice = {
      ...input,
      id: createId("inv"),
      code: input.code ?? nextInvoiceCode(rows),
      paidAmount,
      status: input.status ?? invoiceStatus(input.amount, paidAmount),
      createdAt: now,
      updatedAt: now,
    };
    crmRepository.saveInvoices([row, ...rows]);
    return row;
  },

  recordPayment(input: PaymentInput): Payment {
    const payments = crmRepository.listPayments();
    const now = nowIso();
    const payment: Payment = {
      ...input,
      id: createId("pay"),
      code: input.code ?? nextPaymentCode(payments),
      createdAt: now,
      updatedAt: now,
    };
    crmRepository.savePayments([payment, ...payments]);

    const invoices = crmRepository.listInvoices();
    const idx = invoices.findIndex((i) => i.id === input.invoiceId);
    if (idx >= 0) {
      const inv = invoices[idx];
      const paidAmount = inv.paidAmount + input.amount;
      const next = {
        ...inv,
        paidAmount,
        status: invoiceStatus(inv.amount, paidAmount),
        updatedAt: now,
      };
      const copy = [...invoices];
      copy[idx] = next;
      crmRepository.saveInvoices(copy);
    }
    return payment;
  },

  getCustomerDebt(customerId: string): number {
    return crmRepository
      .listInvoices()
      .filter((i) => i.customerId === customerId && i.status !== "cancelled")
      .reduce((acc, i) => acc + (i.amount - i.paidAmount), 0);
  },

  debtByCustomer(): { customerId: string; debt: number; invoiceCount: number }[] {
    const map = new Map<string, { debt: number; invoiceCount: number }>();
    for (const inv of crmRepository.listInvoices()) {
      if (inv.status === "cancelled") continue;
      const debt = inv.amount - inv.paidAmount;
      if (debt <= 0) continue;
      const cur = map.get(inv.customerId) ?? { debt: 0, invoiceCount: 0 };
      cur.debt += debt;
      cur.invoiceCount += 1;
      map.set(inv.customerId, cur);
    }
    return [...map.entries()].map(([customerId, v]) => ({ customerId, ...v }));
  },

  removeInvoice(id: string): void {
    crmRepository.saveInvoices(crmRepository.listInvoices().filter((i) => i.id !== id));
  },

  removePayment(id: string): void {
    crmRepository.savePayments(crmRepository.listPayments().filter((p) => p.id !== id));
  },
};
