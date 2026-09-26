"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { productsService } from "@/features/products/services/products-service";
import { inventoryService } from "@/features/inventory/services/inventory-service";
import { DEFAULT_PRODUCT_CATEGORIES } from "@/features/products/constants";
import type { Product, ProductInput } from "@/features/products/types";

export function useProducts(filters?: { query?: string; status?: string; category?: string }) {
  const [rows, setRows] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [rawList, levels] = await Promise.all([
        productsService.list({ search: filters?.query, status: filters?.status }),
        inventoryService.listLevels().catch(() => []),
      ]);
      const fullList = Array.isArray(rawList) ? rawList : [];
      setAllProducts(fullList);
      const selectedCategories = filters?.category ? filters.category.split(",").filter(Boolean) : [];
      const list = selectedCategories.length > 0 ? fullList.filter((p) => selectedCategories.includes(p.category)) : fullList;
      setRows(list);
      const map: Record<string, number> = {};
      for (const level of levels ?? []) map[level.productId] = level.qty;
      setStock(map);
    } catch (err) {
      console.error("Error loading products:", err);
      setRows([]);
      setAllProducts([]);
      setStock({});
    } finally {
      setLoading(false);
    }
  }, [filters?.query, filters?.status, filters?.category]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const byId = useMemo(() => new Map(allProducts.map((r) => [r.id, r])), [allProducts]);

  const categories = useMemo(() => {
    const list = allProducts.map((p) => p.category).filter(Boolean) as string[];
    return Array.from(new Set([...DEFAULT_PRODUCT_CATEGORIES, ...list]));
  }, [allProducts]);

  return {
    rows,
    all: allProducts,
    loading,
    reload,
    getById: (id: string) => byId.get(id),
    getStock: (id: string) => stock[id] ?? 0,
    create: async (input: ProductInput) => {
      const row = await productsService.create(input);
      await reload();
      return row;
    },
    update: async (id: string, patch: Partial<ProductInput>) => {
      const row = await productsService.update(id, patch);
      await reload();
      return row;
    },
    remove: async (id: string) => {
      await productsService.remove(id);
      await reload();
    },
    removeMany: async (ids: string[]) => {
      await productsService.removeMany(ids);
      await reload();
    },
    categories,
  };
}
