import { apiFetch, toQuery } from "@/lib/api-client";
import type { Campaign, CampaignInput } from "@/features/marketing/types";
import { loadOwners, ownerByIdSync } from "@/features/shared/api/owners";

type ApiCampaign = {
  id: string; code: string; name: string; channel: string; status: string;
  budget: number | string; spent: number | string; startDate?: string | null; endDate?: string | null;
  ownerId?: string | null; createdAt?: string; updatedAt?: string;
};

async function mapCampaign(row: ApiCampaign, leadsCount = 0): Promise<Campaign> {
  const owners = await loadOwners();
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    channel: row.channel as Campaign["channel"],
    status: row.status as Campaign["status"],
    budget: Number(row.budget),
    spent: Number(row.spent),
    leadsCount,
    owner: ownerByIdSync(row.ownerId ?? "", owners),
    startDate: row.startDate ?? "",
    endDate: row.endDate ?? "",
    createdAt: row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updatedAt ?? new Date().toISOString(),
  };
}

export const marketingService = {
  async list(params?: { search?: string; status?: string }) {
    const result = await apiFetch<ApiCampaign[]>(`/api/v1/campaigns${toQuery({ ...params, pageSize: 100 })}`);
    return Promise.all(
      (result.data ?? []).map(async (c) => {
        try {
          const stats = await apiFetch<{ leadsCount: number }>(`/api/v1/campaigns/${c.id}/stats`);
          return mapCampaign(c, stats.data.leadsCount);
        } catch {
          return mapCampaign(c, 0);
        }
      }),
    );
  },
  async create(input: CampaignInput) {
    const result = await apiFetch<ApiCampaign>("/api/v1/campaigns", {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        channel: input.channel,
        budget: input.budget,
        startDate: input.startDate || undefined,
        endDate: input.endDate || undefined,
        ownerId: input.owner?.id,
        status: input.status,
      }),
    });
    return mapCampaign(result.data, 0);
  },
  async update(id: string, patch: Partial<CampaignInput>) {
    const result = await apiFetch<ApiCampaign>(`/api/v1/campaigns/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: patch.name,
        channel: patch.channel,
        budget: patch.budget,
        spent: patch.spent,
        startDate: patch.startDate,
        endDate: patch.endDate,
        status: patch.status,
        ownerId: patch.owner?.id,
      }),
    });
    return mapCampaign(result.data);
  },
  async remove() {
    throw new Error("Xóa chiến dịch chưa hỗ trợ — hãy đặt trạng thái completed");
  },
};
