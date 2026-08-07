import { apiFetch, toQuery } from "@/lib/api-client";
import type { Contract } from "@/features/contracts/types";
import { loadOwners, ownerByIdSync } from "@/features/shared/api/owners";

type ApiContract = {
  id: string; code: string; customerId: string; quoteId?: string | null; dealId?: string | null;
  status: string; value: number | string; startDate?: string | null; endDate?: string | null;
  ownerId?: string | null; terms?: string | null; createdAt?: string; updatedAt?: string;
};

async function mapContract(row: ApiContract): Promise<Contract> {
  const owners = await loadOwners();
  return {
    id: row.id,
    code: row.code,
    customerId: row.customerId,
    quoteId: row.quoteId ?? undefined,
    dealId: row.dealId ?? undefined,
    status: row.status as Contract["status"],
    value: Number(row.value),
    startDate: row.startDate ?? "",
    endDate: row.endDate ?? "",
    owner: ownerByIdSync(row.ownerId ?? "", owners),
    terms: row.terms ?? undefined,
    createdAt: row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updatedAt ?? new Date().toISOString(),
  };
}

export const contractsService = {
  async list(params?: { search?: string; status?: string; customerId?: string }) {
    const result = await apiFetch<ApiContract[]>(`/api/v1/contracts${toQuery({ ...params, pageSize: 100 })}`);
    return Promise.all((result.data ?? []).map(mapContract));
  },
  async getById(id: string) {
    const result = await apiFetch<ApiContract>(`/api/v1/contracts/${id}`);
    return mapContract(result.data);
  },
};
