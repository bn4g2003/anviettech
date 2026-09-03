"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { contractsService } from "@/features/contracts/services/contracts-service";
import type { Contract, ContractInput } from "@/features/contracts/types";

export function useContracts(filters?: { query?: string; status?: string; customerId?: string; enabled?: boolean }) {
  const [rows, setRows] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (filters?.enabled === false) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await contractsService.list(filters);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading contracts:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.query, filters?.status, filters?.customerId, filters?.enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  return {
    rows,
    all: rows,
    loading,
    reload,
    getById: (id: string) => byId.get(id),
    create: async (input: ContractInput) => {
      const created = await contractsService.create(input);
      await reload();
      return created;
    },
    update: async (id: string, patch: Partial<ContractInput>) => {
      const updated = await contractsService.update(id, patch);
      await reload();
      return updated;
    },
    remove: async (_deleteId: string) => undefined,
    removeMany: async (_ids: string[]) => undefined,
  };
}
