"use client";

import { useMemo } from "react";
import { useCrmStore } from "@/features/shared/store/crm-store";
import { ordersService } from "@/features/orders/services/orders-service";
import type { OrderInput } from "@/features/orders/types";
import { confirmOrder } from "@/features/shared/workflows/sales-workflows";

export function useOrders(filters?: { query?: string; status?: string }) {
  const orders = useCrmStore((s) => s.orders);

  const rows = useMemo(() => {
    return ordersService.search(filters?.query ?? "", {
      status: filters?.status || undefined,
    });
  }, [orders, filters?.query, filters?.status]);

  return {
    rows,
    all: orders,
    getById: (id: string) => ordersService.getById(id),
    create: (input: OrderInput) => ordersService.create(input),
    update: (id: string, patch: Partial<OrderInput>) => ordersService.update(id, patch),
    remove: (id: string) => ordersService.remove(id),
    removeMany: (ids: string[]) => ordersService.removeMany(ids),
    confirm: (id: string) => confirmOrder(id),
  };
}
