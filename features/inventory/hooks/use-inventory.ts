"use client";

import { useMemo } from "react";
import { useCrmStore } from "@/features/shared/store/crm-store";
import { inventoryService } from "@/features/inventory/services/inventory-service";
import type { StockMoveInput } from "@/features/inventory/types";

export function useInventory() {
  const stockLevels = useCrmStore((s) => s.stockLevels);
  const stockMoves = useCrmStore((s) => s.stockMoves);
  const products = useCrmStore((s) => s.products);

  const levelsWithProduct = useMemo(() => {
    return stockLevels.map((s) => ({
      ...s,
      id: s.productId,
      product: products.find((p) => p.id === s.productId),
    }));
  }, [stockLevels, products]);

  return {
    levels: levelsWithProduct,
    moves: stockMoves,
    lowStock: inventoryService.lowStock(),
    createMove: (input: StockMoveInput) => inventoryService.createMove(input),
    postMove: (id: string) => inventoryService.postMove(id),
    removeMove: (id: string) => inventoryService.removeMove(id),
    getQty: (productId: string) => inventoryService.getQty(productId),
    getById: (id: string) => stockMoves.find((m) => m.id === id),
  };
}
