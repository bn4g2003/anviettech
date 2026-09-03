import { apiFetch, toQuery } from "@/lib/api-client";
import type { Product, ProductInput } from "@/features/products/types";

type ApiProduct = {
  id: string; sku: string; name: string; category?: string | null; unit: string;
  unitPrice: number | string; costPrice?: number | string; vatPercent: number | string; minStock: number | string;
  itemType?: string; status: string; description?: string | null; createdAt?: string; updatedAt?: string;
};

function mapProduct(row: ApiProduct): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category ?? "",
    unit: row.unit,
    unitPrice: Number(row.unitPrice),
    costPrice: Number(row.costPrice ?? 0),
    vatPercent: Number(row.vatPercent),
    minStock: Number(row.minStock),
    itemType: row.itemType === "service" ? "service" : "goods",
    status: (row.status as Product["status"]) || "active",
    description: row.description ?? undefined,
    createdAt: row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updatedAt ?? new Date().toISOString(),
  };
}

export const productsService = {
  async list(params?: { search?: string; status?: string }) {
    const result = await apiFetch<ApiProduct[]>(`/api/v1/products${toQuery({ ...params, pageSize: 100 })}`);
    return (result.data ?? []).map(mapProduct);
  },
  async getById(id: string) {
    const list = await this.list();
    return list.find((p) => p.id === id);
  },
  async create(input: ProductInput) {
    const result = await apiFetch<ApiProduct>("/api/v1/products", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return mapProduct(result.data);
  },
  async update(id: string, patch: Partial<ProductInput>) {
    const result = await apiFetch<ApiProduct>(`/api/v1/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    return mapProduct(result.data);
  },
  async remove(id: string) {
    await apiFetch(`/api/v1/products/${id}`, { method: "DELETE" });
  },
  async removeMany(ids: string[]) {
    await Promise.all(ids.map((id) => this.remove(id)));
  },
  async categories() {
    const list = await this.list();
    return [...new Set(list.map((p) => p.category).filter(Boolean))];
  },
};
