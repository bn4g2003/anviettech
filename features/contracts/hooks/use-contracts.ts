"use client";

import { useMemo } from "react";
import { useCrmStore } from "@/features/shared/store/crm-store";
import { contractsService } from "@/features/contracts/services/contracts-service";
import type { ContractInput } from "@/features/contracts/types";

export function useContracts(filters?: { query?: string; status?: string; customerId?: string }) {
  const contracts = useCrmStore((s) => s.contracts);

  const rows = useMemo(() => {
    return contractsService.search(filters?.query ?? "", {
      status: filters?.status || undefined,
      customerId: filters?.customerId || undefined,
    });
  }, [contracts, filters?.query, filters?.status, filters?.customerId]);

  return {
    rows,
    all: contracts,
    getById: (id: string) => contractsService.getById(id),
    create: (input: ContractInput) => contractsService.create(input),
    update: (id: string, patch: Partial<ContractInput>) => contractsService.update(id, patch),
    remove: (id: string) => contractsService.remove(id),
    removeMany: (ids: string[]) => contractsService.removeMany(ids),
  };
}
