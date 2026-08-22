"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { contractsService } from "@/features/contracts/services/contracts-service";
import type { Contract, ContractInput } from "@/features/contracts/types";

export function useContracts(filters?: { query?: string; status?: string; customerId?: string }) {
  const [rows, setRows] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
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
  }, [filters?.query, filters?.status, filters?.customerId]);

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
    create: async (_input: ContractInput) => {
      throw new Error("Hợp đồng được tạo khi duyệt báo giá");
    },
    update: async (_id: string, _patch: Partial<ContractInput>) => {
      throw new Error("Chỉnh sửa hợp đồng chưa hỗ trợ trên UI");
    },
    remove: async (_deleteId: string) => undefined,
    removeMany: async (_ids: string[]) => undefined,
  };
}
