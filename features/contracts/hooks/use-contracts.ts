"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { contractsService } from "@/features/contracts/services/contracts-service";
import type { Contract } from "@/features/contracts/types";

export function useContracts(filters?: { query?: string; status?: string; customerId?: string }) {
  const [rows, setRows] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await contractsService.list(filters));
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
    create: async () => {
      throw new Error("Hợp đồng được tạo khi duyệt báo giá");
    },
    update: async () => {
      throw new Error("Chỉnh sửa hợp đồng chưa hỗ trợ trên UI");
    },
    remove: async () => undefined,
    removeMany: async () => undefined,
  };
}
