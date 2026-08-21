import { apiFetch, toQuery } from "@/lib/api-client";
import type { Quote, QuoteInput, QuoteStatus } from "@/features/quotes/types";
import { loadOwners, ownerByIdSync } from "@/features/shared/api/owners";

type ApiQuote = {
  id: string; code: string; customerId: string; dealId?: string | null; status: QuoteStatus;
  validUntil?: string | null; ownerId?: string | null; terms?: string | null;
  subtotal: number | string; total: number | string; createdAt?: string; updatedAt?: string;
  lines?: { id: string; productId: string; productName: string; qty: number | string; unitPrice: number | string; discountPercent: number | string; vatPercent: number | string; lineTotal: number | string }[];
};

async function mapQuote(row: ApiQuote): Promise<Quote> {
  const owners = await loadOwners();
  let lines = row.lines;
  if (!lines) {
    const full = await apiFetch<ApiQuote>(`/api/v1/quotes/${row.id}`);
    lines = full.data.lines ?? [];
  }
  return {
    id: row.id,
    code: row.code,
    customerId: row.customerId,
    dealId: row.dealId ?? undefined,
    status: row.status,
    validUntil: row.validUntil ?? "",
    owner: ownerByIdSync(row.ownerId ?? "", owners),
    terms: row.terms ?? undefined,
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    lines: (lines ?? []).map((l) => ({
      id: l.id,
      productId: l.productId,
      productName: l.productName,
      qty: Number(l.qty),
      unitPrice: Number(l.unitPrice),
      discountPercent: Number(l.discountPercent),
      vatPercent: Number(l.vatPercent),
      lineTotal: Number(l.lineTotal),
    })),
    createdAt: row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updatedAt ?? new Date().toISOString(),
  };
}

export const quotesService = {
  async list(params?: { search?: string; status?: string; customerId?: string }) {
    const result = await apiFetch<ApiQuote[]>(`/api/v1/quotes${toQuery({ ...params, pageSize: 100 })}`);
    return Promise.all((result.data ?? []).map(mapQuote));
  },
  async getById(id: string) {
    const result = await apiFetch<ApiQuote>(`/api/v1/quotes/${id}`);
    return mapQuote(result.data);
  },
  async create(input: QuoteInput) {
    const result = await apiFetch<ApiQuote>("/api/v1/quotes", {
      method: "POST",
      body: JSON.stringify({
        customerId: input.customerId,
        dealId: input.dealId,
        validUntil: input.validUntil || undefined,
        ownerId: input.owner?.id?.trim() ? input.owner.id.trim() : undefined,
        terms: input.terms,
        lines: input.lines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          unitPrice: l.unitPrice,
          discountPercent: l.discountPercent,
          vatPercent: l.vatPercent,
        })),
      }),
    });
    if (input.status === "sent") await apiFetch(`/api/v1/quotes/${result.data.id}/send`, { method: "POST" });
    return this.getById(result.data.id);
  },
  async update(id: string, patch: Partial<QuoteInput>) {
    if (patch.lines || patch.terms !== undefined || patch.validUntil !== undefined || patch.dealId !== undefined) {
      await apiFetch(`/api/v1/quotes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          validUntil: patch.validUntil,
          terms: patch.terms,
          dealId: patch.dealId,
          lines: patch.lines?.map((l) => ({
            productId: l.productId,
            qty: l.qty,
            unitPrice: l.unitPrice,
            discountPercent: l.discountPercent,
            vatPercent: l.vatPercent,
          })),
        }),
      });
    }
    if (patch.status === "sent") await apiFetch(`/api/v1/quotes/${id}/send`, { method: "POST" });
    if (patch.status === "rejected") await apiFetch(`/api/v1/quotes/${id}/reject`, { method: "POST" });
    return this.getById(id);
  },
  async remove(id: string) {
    await apiFetch(`/api/v1/quotes/${id}`, { method: "DELETE" });
  },
  async removeMany(ids: string[]) {
    await Promise.all(ids.map((id) => this.remove(id)));
  },
  async approve(id: string) {
    return apiFetch<{ contractId: string; orderId: string }>(`/api/v1/quotes/${id}/approve`, { method: "POST" });
  },
  async send(id: string) {
    return apiFetch(`/api/v1/quotes/${id}/send`, { method: "POST" });
  },
};
