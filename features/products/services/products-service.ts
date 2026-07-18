import type { Product, ProductInput } from "@/features/products/types";
import { crmRepository } from "@/features/shared/repository/crm-repository";
import { createId } from "@/features/shared/utils/id";
import { nowIso } from "@/features/shared/utils/date";

export const productsService = {
  list(): Product[] {
    return crmRepository.listProducts();
  },

  getById(id: string): Product | undefined {
    return crmRepository.listProducts().find((p) => p.id === id);
  },

  search(query: string, filters?: { category?: string; status?: string }) {
    const q = query.trim().toLowerCase();
    return crmRepository.listProducts().filter((p) => {
      if (filters?.category && p.category !== filters.category) return false;
      if (filters?.status && p.status !== filters.status) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  },

  create(input: ProductInput): Product {
    const now = nowIso();
    const row: Product = { ...input, id: createId("prd"), createdAt: now, updatedAt: now };
    crmRepository.saveProducts([row, ...crmRepository.listProducts()]);
    return row;
  },

  update(id: string, patch: Partial<ProductInput>): Product {
    const rows = crmRepository.listProducts();
    const idx = rows.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error("Không tìm thấy sản phẩm");
    const next = { ...rows[idx], ...patch, updatedAt: nowIso() };
    const copy = [...rows];
    copy[idx] = next;
    crmRepository.saveProducts(copy);
    return next;
  },

  remove(id: string): void {
    crmRepository.saveProducts(crmRepository.listProducts().filter((p) => p.id !== id));
  },

  removeMany(ids: string[]): void {
    const set = new Set(ids);
    crmRepository.saveProducts(crmRepository.listProducts().filter((p) => !set.has(p.id)));
  },

  categories(): string[] {
    return [...new Set(crmRepository.listProducts().map((p) => p.category))];
  },
};
