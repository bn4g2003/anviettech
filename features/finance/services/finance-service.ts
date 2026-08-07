import { apiFetch, toQuery } from "@/lib/api-client";
import type { Invoice, Payment, PaymentInput, PaymentMethod } from "@/features/finance/types";
import { loadOwners, ownerByIdSync } from "@/features/shared/api/owners";

type ApiInvoice = {
  id: string; code: string; customerId: string; orderId?: string | null; contractId?: string | null;
  status: string; amount: number | string; paidAmount: number | string; dueDate?: string | null;
  ownerId?: string | null; createdAt?: string; updatedAt?: string;
};

type ApiPayment = {
  id: string; code: string; invoiceId: string; customerId: string; amount: number | string;
  method: string; paidAt: string; ownerId?: string | null; note?: string | null;
  createdAt?: string; updatedAt?: string;
};

async function mapInvoice(row: ApiInvoice): Promise<Invoice> {
  const owners = await loadOwners();
  return {
    id: row.id,
    code: row.code,
    customerId: row.customerId,
    orderId: row.orderId ?? undefined,
    contractId: row.contractId ?? undefined,
    status: row.status as Invoice["status"],
    amount: Number(row.amount),
    paidAmount: Number(row.paidAmount),
    dueDate: row.dueDate ?? "",
    owner: ownerByIdSync(row.ownerId ?? "", owners),
    createdAt: row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updatedAt ?? new Date().toISOString(),
  };
}

async function mapPayment(row: ApiPayment): Promise<Payment> {
  const owners = await loadOwners();
  const method = row.method === "transfer" ? "bank" : row.method;
  return {
    id: row.id,
    code: row.code,
    invoiceId: row.invoiceId,
    customerId: row.customerId,
    amount: Number(row.amount),
    method: method as PaymentMethod,
    paidAt: row.paidAt,
    owner: ownerByIdSync(row.ownerId ?? "", owners),
    note: row.note ?? undefined,
    createdAt: row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updatedAt ?? new Date().toISOString(),
  };
}

export const financeService = {
  async listInvoices(params?: { search?: string; status?: string; customerId?: string }) {
    const result = await apiFetch<ApiInvoice[]>(`/api/v1/invoices${toQuery({ ...params, pageSize: 100 })}`);
    return Promise.all((result.data ?? []).map(mapInvoice));
  },
  async listPayments(params?: { search?: string; customerId?: string }) {
    const result = await apiFetch<ApiPayment[]>(`/api/v1/payments${toQuery({ ...params, pageSize: 100 })}`);
    return Promise.all((result.data ?? []).map(mapPayment));
  },
  async recordPayment(input: PaymentInput) {
    const method = input.method === "bank" ? "transfer" : input.method;
    await apiFetch("/api/v1/payments", {
      method: "POST",
      body: JSON.stringify({
        invoiceId: input.invoiceId,
        amount: input.amount,
        method,
        paidAt: input.paidAt,
        note: input.note,
      }),
    });
  },
  async getCustomerDebt(customerId: string) {
    const invoices = await this.listInvoices({ customerId });
    return invoices.reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0);
  },
};
