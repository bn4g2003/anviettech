"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { inventoryService, type ApiBalance } from "@/features/inventory/services/inventory-service";
import { productsService } from "@/features/products/services/products-service";
import type { Product } from "@/features/products/types";
import type { StockLevel, StockMove, StockMoveInput } from "@/features/inventory/types";

export function useInventory() {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [balances, setBalances] = useState<ApiBalance[]>([]);
  const [stockMoves, setStockMoves] = useState<StockMove[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; code: string; name: string; isDefault: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [bal, moves, prods, wh] = await Promise.all([
        inventoryService.listBalances(),
        inventoryService.listMoves(),
        productsService.list(),
        inventoryService.listWarehouses(),
      ]);
      const safeBal = Array.isArray(bal) ? bal : [];
      const byProduct = new Map<string, number>();
      const meta = new Map<string, { minStock: number; belowMin: boolean; productName: string }>();
      for (const row of safeBal) {
        byProduct.set(row.productId, (byProduct.get(row.productId) ?? 0) + Number(row.qty));
        meta.set(row.productId, {
          minStock: Number(row.minStock),
          belowMin: Boolean(row.belowMin),
          productName: row.productName,
        });
      }
      const levels = [...byProduct.entries()].map(([productId, qty]) => ({
        productId,
        qty,
        ...meta.get(productId),
      }));

      setBalances(safeBal);
      setStockLevels(levels);
      setStockMoves(Array.isArray(moves) ? moves : []);
      setProducts(Array.isArray(prods) ? prods : []);
      setWarehouses(Array.isArray(wh) ? wh : []);
    } catch (err) {
      console.error("Error loading inventory:", err);
      setBalances([]);
      setStockLevels([]);
      setStockMoves([]);
      setProducts([]);
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const levelsWithProduct = useMemo(() => {
    const productMap = new Map(products.map((p) => [p.id, p]));
    const levelMap = new Map(stockLevels.map((s) => [s.productId, s]));

    const result: (StockLevel & {
      id: string;
      minStock?: number;
      belowMin?: boolean;
      productName?: string;
      product?: Product;
    })[] = products.map((p) => {
      const level = levelMap.get(p.id);
      return {
        id: p.id,
        productId: p.id,
        qty: level ? level.qty : 0,
        minStock: p.minStock,
        belowMin: (level ? level.qty : 0) < (p.minStock ?? 0),
        productName: p.name,
        product: p,
      };
    });

    for (const s of stockLevels) {
      if (!productMap.has(s.productId)) {
        result.push({
          ...s,
          id: s.productId,
          product: undefined,
        });
      }
    }
    return result;
  }, [stockLevels, products]);

  return {
    levels: levelsWithProduct,
    balances,
    moves: stockMoves,
    warehouses,
    products,
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
