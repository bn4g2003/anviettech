"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { inventoryService } from "@/features/inventory/services/inventory-service";
import { productsService } from "@/features/products/services/products-service";
import type { Product } from "@/features/products/types";
import type { StockLevel, StockMove, StockMoveInput } from "@/features/inventory/types";

export function useInventory() {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [stockMoves, setStockMoves] = useState<StockMove[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; code: string; name: string; isDefault: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [levels, moves, prods, wh] = await Promise.all([
        inventoryService.listLevels(),
        inventoryService.listMoves(),
        productsService.list(),
        inventoryService.listWarehouses(),
      ]);
      setStockLevels(levels);
      setStockMoves(moves);
      setProducts(prods);
      setWarehouses(wh);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const levelsWithProduct = useMemo(
    () =>
      stockLevels.map((s) => ({
        ...s,
        id: s.productId,
        product: products.find((p) => p.id === s.productId),
      })),
    [stockLevels, products],
  );

  return {
    levels: levelsWithProduct,
    moves: stockMoves,
    warehouses,
    loading,
    reload,
    lowStock: stockLevels.filter((l) => {
      const p = products.find((x) => x.id === l.productId);
      return p ? l.qty < p.minStock : false;
    }),
    createMove: async (input: StockMoveInput) => {
      const row = await inventoryService.createMove(input);
      await reload();
      return row;
    },
    postMove: async (id: string) => {
      const row = await inventoryService.postMove(id);
      await reload();
      return row;
    },
    removeMove: async (id: string) => {
      await inventoryService.removeMove(id);
      await reload();
    },
    getQty: (productId: string) => stockLevels.find((l) => l.productId === productId)?.qty ?? 0,
    getById: (id: string) => stockMoves.find((m) => m.id === id),
  };
}
