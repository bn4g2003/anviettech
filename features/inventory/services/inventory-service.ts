import { apiFetch, toQuery } from "@/lib/api-client";
import type { StockLevel, StockMove, StockMoveInput } from "@/features/inventory/types";
import { loadOwners, ownerByIdSync } from "@/features/shared/api/owners";

type ApiBalance = {
  warehouseId: string; productId: string; sku: string; productName: string;
  minStock: number | string; qty: number | string; belowMin: boolean;
};

type ApiMove = {
  id: string; code: string; type: string; status: string; orderId?: string | null;
  warehouseFromId?: string | null; warehouseToId?: string | null; ownerId?: string | null;
  note?: string | null; postedAt?: string | null; createdAt?: string; updatedAt?: string;
  lines?: { id: string; productId: string; productName: string; qty: number | string }[];
};

async function mapMove(row: ApiMove): Promise<StockMove> {
  const owners = await loadOwners();
  return {
    id: row.id,
    code: row.code,
    type: row.type as StockMove["type"],
    status: row.status as StockMove["status"],
    orderId: row.orderId ?? undefined,
    warehouseFrom: row.warehouseFromId ?? undefined,
    warehouseTo: row.warehouseToId ?? undefined,
    owner: ownerByIdSync(row.ownerId ?? "", owners),
    note: row.note ?? undefined,
    lines: (row.lines ?? []).map((l) => ({
      id: l.id,
      productId: l.productId,
      productName: l.productName,
      qty: Number(l.qty),
    })),
    createdAt: row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updatedAt ?? new Date().toISOString(),
  };
}

export const inventoryService = {
  async listLevels(): Promise<(StockLevel & { minStock?: number; belowMin?: boolean; productName?: string })[]> {
    const result = await apiFetch<ApiBalance[]>("/api/v1/inventory/balances");
    const byProduct = new Map<string, number>();
    const meta = new Map<string, { minStock: number; belowMin: boolean; productName: string }>();
    for (const row of result.data ?? []) {
      byProduct.set(row.productId, (byProduct.get(row.productId) ?? 0) + Number(row.qty));
      meta.set(row.productId, {
        minStock: Number(row.minStock),
        belowMin: Boolean(row.belowMin),
        productName: row.productName,
      });
    }
    return [...byProduct.entries()].map(([productId, qty]) => ({
      productId,
      qty,
      ...meta.get(productId),
    }));
  },
  async listMoves() {
    const result = await apiFetch<ApiMove[]>(`/api/v1/stock-moves${toQuery({ pageSize: 100 })}`);
    return Promise.all(
      (result.data ?? []).map(async (m) => {
        const full = await apiFetch<ApiMove>(`/api/v1/stock-moves/${m.id}`);
        return mapMove(full.data);
      }),
    );
  },
  async listWarehouses() {
    const result = await apiFetch<{ id: string; code: string; name: string; isDefault: boolean }[]>(
      `/api/v1/warehouses${toQuery({ pageSize: 50 })}`,
    );
    return result.data ?? [];
  },
  async createMove(input: StockMoveInput) {
    const warehouses = await this.listWarehouses();
    const defaultWh = warehouses.find((w) => w.isDefault) ?? warehouses[0];
    const findWh = (nameOrId?: string) =>
      warehouses.find((w) => w.id === nameOrId || w.name === nameOrId || w.code === nameOrId)?.id ?? defaultWh?.id;
    const result = await apiFetch<ApiMove>("/api/v1/stock-moves", {
      method: "POST",
      body: JSON.stringify({
        type: input.type,
        warehouseFromId: input.type !== "in" ? findWh(input.warehouseFrom) : undefined,
        warehouseToId: input.type !== "out" ? findWh(input.warehouseTo) : undefined,
        note: input.note,
        post: input.status === "posted",
        lines: input.lines.map((l) => ({ productId: l.productId, qty: l.qty })),
      }),
    });
    return mapMove(result.data);
  },
  async postMove(id: string) {
    const result = await apiFetch<ApiMove>(`/api/v1/stock-moves/${id}/post`, { method: "POST" });
    return mapMove(result.data);
  },
  async removeMove(id: string) {
    await apiFetch(`/api/v1/stock-moves/${id}`, { method: "DELETE" });
  },
  async getQty(productId: string) {
    const levels = await this.listLevels();
    return levels.find((l) => l.productId === productId)?.qty ?? 0;
  },
  async lowStock() {
    const levels = await this.listLevels();
    return levels.filter((l) => l.belowMin);
  },
};
