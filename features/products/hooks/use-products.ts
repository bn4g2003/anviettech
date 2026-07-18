"use client";

import { useMemo } from "react";
import { useCrmStore } from "@/features/shared/store/crm-store";
import { productsService } from "@/features/products/services/products-service";
import type { ProductInput } from "@/features/products/types";
import { inventoryService } from "@/features/inventory/services/inventory-service";

export function useProducts(filters?: { query?: string; category?: string; status?: string }) {
  const products = useCrmStore((s) => s.products);
  const stockLevels = useCrmStore((s) => s.stockLevels);

  const rows = useMemo(() => {
    return productsService.search(filters?.query ?? "", {
      category: filters?.category || undefined,
      status: filters?.status || undefined,
    });
  }, [products, filters?.query, filters?.category, filters?.status]);

  return {
    rows,
    all: products,
    categories: productsService.categories(),
    getById: (id: string) => productsService.getById(id),
    getStock: (productId: string) =>
      stockLevels.find((s) => s.productId === productId)?.qty ??
      inventoryService.getQty(productId),
    create: (input: ProductInput) => productsService.create(input),
    update: (id: string, patch: Partial<ProductInput>) => productsService.update(id, patch),
    remove: (id: string) => productsService.remove(id),
    removeMany: (ids: string[]) => productsService.removeMany(ids),
  };
}
