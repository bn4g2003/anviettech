"use client";

import { useMemo } from "react";
import { useCrmStore } from "@/features/shared/store/crm-store";
import { customersService } from "@/features/customers/services/customers-service";
import type { CustomerInput } from "@/features/customers/types";
import { financeService } from "@/features/finance/services/finance-service";

export function useCustomers(filters?: {
  query?: string;
  status?: string;
  type?: string;
  ownerId?: string;
}) {
  const customers = useCrmStore((s) => s.customers);

  const rows = useMemo(() => {
    return customersService.search(filters?.query ?? "", {
      status: filters?.status || undefined,
      type: filters?.type || undefined,
      ownerId: filters?.ownerId || undefined,
    });
  }, [customers, filters?.query, filters?.status, filters?.type, filters?.ownerId]);

  return {
    rows,
    all: customers,
    create: (input: CustomerInput) => customersService.create(input),
    update: (id: string, patch: Partial<CustomerInput>) => customersService.update(id, patch),
    remove: (id: string) => customersService.remove(id),
    removeMany: (ids: string[]) => customersService.removeMany(ids),
    getById: (id: string) => customersService.getById(id),
    getDebt: (id: string) => financeService.getCustomerDebt(id),
  };
}
