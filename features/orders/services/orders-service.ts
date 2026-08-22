import { apiFetch, toQuery } from "@/lib/api-client";
import type { Order, OrderStatus } from "@/features/orders/types";
import { loadOwners, ownerByIdSync } from "@/features/shared/api/owners";

type ApiOrder = {
  id: string; code: string; customerId: string; contractId?: string | null; quoteId?: string | null;
  status: OrderStatus; ownerId?: string | null; total: number | string; createdAt?: string; updatedAt?: string;
  lines?: { id: string; productId: string; productName: string; qty: number | string; unitPrice: number | string; lineTotal: number | string }[];
};

async function mapOrder(row: ApiOrder): Promise<Order> {
  const owners = await loadOwners();
  let lines = row.lines;
  if (!lines) {
    try {
      const full = await apiFetch<ApiOrder>(`/api/v1/orders/${row.id}`);
      lines = full?.data?.lines ?? [];
    } catch {
      lines = [];
    }
  }
  return {
    id: row.id,
    code: row.code,
    customerId: row.customerId,
    contractId: row.contractId ?? undefined,
    quoteId: row.quoteId ?? undefined,
    status: row.status,
    owner: ownerByIdSync(row.ownerId ?? "", owners),
    total: Number(row.total),
    lines: (lines ?? []).map((l) => ({
      id: l.id,
      productId: l.productId,
      productName: l.productName,
      qty: Number(l.qty),
      unitPrice: Number(l.unitPrice),
      lineTotal: Number(l.lineTotal),
    })),
    createdAt: row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updatedAt ?? new Date().toISOString(),
  };
}

export const ordersService = {
  async list(params?: { search?: string; status?: string; customerId?: string }) {
    const result = await apiFetch<ApiOrder[]>(`/api/v1/orders${toQuery({ ...params, pageSize: 100 })}`);
    return Promise.all((result.data ?? []).map(mapOrder));
  },
  async getById(id: string) {
    const result = await apiFetch<ApiOrder>(`/api/v1/orders/${id}`);
    return mapOrder(result.data);
  },
  async confirm(id: string, warehouseId: string) {
    return apiFetch<{ stockMoveId: string; invoiceId: string }>(`/api/v1/orders/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify({ warehouseId }),
    });
  },
  async remove(id: string) {
    // soft cancel via status not implemented — no DELETE for confirmed; skip for draft only if needed
    void id;
  },
};
