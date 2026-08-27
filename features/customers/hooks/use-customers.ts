"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { customersService } from "@/features/customers/services/customers-service";
import type { Customer, CustomerInput } from "@/features/customers/types";
import { apiFetch, toQuery } from "@/lib/api-client";

export function useCustomers(filters?: {
  query?: string;
  status?: string;
  type?: string;
  ownerId?: string;
  scope?: "my";
}) {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debts, setDebts] = useState<Record<string, number>>({});

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, invoices] = await Promise.all([
        customersService.list({
          search: filters?.query,
          status: filters?.status,
          ownerId: filters?.ownerId,
          scope: filters?.scope,
          pageSize: 100,
        }),
        apiFetch<{ customerId: string; amount: number | string; paidAmount: number | string }[]>(
          `/api/v1/invoices${toQuery({ pageSize: 100 })}`,
        ).catch(() => ({
          data: [] as { customerId: string; amount: number | string; paidAmount: number | string }[],
        })),
      ]);
      const filtered = filters?.type ? list.filter((c) => c.type === filters.type) : list;
      setRows(filtered);

      const map: Record<string, number> = {};
      for (const inv of invoices.data ?? []) {
        map[inv.customerId] = (map[inv.customerId] ?? 0) + (Number(inv.amount) - Number(inv.paidAmount));
      }
      setDebts(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải khách hàng");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.query, filters?.status, filters?.type, filters?.ownerId, filters?.scope]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  return {
    rows,
    all: rows,
    loading,
    error,
    reload,
    create: async (input: CustomerInput) => {
      const row = await customersService.create(input);
      await reload();
      return row;
    },
    update: async (id: string, patch: Partial<CustomerInput>) => {
      const row = await customersService.update(id, patch);
      await reload();
      return row;
    },
    remove: async (id: string) => {
      await customersService.remove(id);
      await reload();
    },
    removeMany: async (ids: string[]) => {
      await customersService.removeMany(ids);
      await reload();
    },
    getById: (id: string) => byId.get(id),
    getDebt: (id: string) => debts[id] ?? 0,
  };
}
