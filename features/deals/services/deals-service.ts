import { apiFetch, toQuery } from "@/lib/api-client";
import type { Deal, DealInput, DealStage } from "@/features/deals/types";
import { DEAL_STAGE_META } from "@/features/deals/types";
import { loadOwners, ownerByIdSync } from "@/features/shared/api/owners";

type ApiDeal = {
  id: string; code: string; title: string; customerId: string; stage: DealStage; value: number | string;
  probability: number; expectedCloseDate?: string | null; ownerId?: string | null; notes?: string | null;
  createdAt?: string; updatedAt?: string;
};

async function mapDeal(row: ApiDeal): Promise<Deal> {
  const owners = await loadOwners();
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    customerId: row.customerId,
    stage: row.stage,
    value: Number(row.value),
    probability: row.probability,
    expectedCloseDate: row.expectedCloseDate ?? "",
    owner: ownerByIdSync(row.ownerId ?? "", owners),
    productIds: [],
    notes: row.notes ?? undefined,
    createdAt: row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updatedAt ?? new Date().toISOString(),
  };
}

export const dealsService = {
  async list(params?: { search?: string; status?: string; ownerId?: string; customerId?: string }) {
    const result = await apiFetch<ApiDeal[]>(`/api/v1/deals${toQuery({ ...params, pageSize: 100 })}`);
    return Promise.all((result.data ?? []).map(mapDeal));
  },
  async getById(id: string) {
    const result = await apiFetch<ApiDeal>(`/api/v1/deals/${id}`);
    return mapDeal(result.data);
  },
  async create(input: DealInput) {
    const result = await apiFetch<ApiDeal>("/api/v1/deals", {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        customerId: input.customerId,
        value: input.value,
        expectedCloseDate: input.expectedCloseDate || undefined,
        ownerId: input.owner?.id?.trim() ? input.owner.id.trim() : undefined,
        notes: input.notes,
        productIds: input.productIds,
        probability: input.probability ?? DEAL_STAGE_META[input.stage]?.probability,
      }),
    });
    if (input.stage && input.stage !== "new") {
      await this.setStage(result.data.id, input.stage);
      return this.getById(result.data.id);
    }
    return mapDeal(result.data);
  },
  async update(id: string, patch: Partial<DealInput>) {
    const result = await apiFetch<ApiDeal>(`/api/v1/deals/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: patch.title,
        value: patch.value,
        expectedCloseDate: patch.expectedCloseDate,
        ownerId: patch.owner?.id?.trim() ? patch.owner.id.trim() : undefined,
        notes: patch.notes,
        probability: patch.probability,
      }),
    });
    return mapDeal(result.data);
  },
  async setStage(id: string, stage: DealStage, reason?: string) {
    const result = await apiFetch<ApiDeal>(`/api/v1/deals/${id}/stage`, {
      method: "POST",
      body: JSON.stringify({ stage, reason }),
    });
    return mapDeal(result.data);
  },
  async remove(id: string) {
    await apiFetch(`/api/v1/deals/${id}`, { method: "DELETE" });
  },
  async removeMany(ids: string[]) {
    await Promise.all(ids.map((id) => this.remove(id)));
  },
};
