import { apiFetch, toQuery } from "@/lib/api-client";
import { loadOwners, ownerByIdSync } from "@/features/shared/api/owners";
import type { Activity, ActivityInput } from "@/features/activities/types";

type ApiActivity = {
  id: string; type: string; subject: string; content?: string | null; occurredAt?: string | null;
  ownerId?: string | null; customerId?: string | null; dealId?: string | null; createdAt?: string; updatedAt?: string;
};

async function mapActivity(row: ApiActivity): Promise<Activity> {
  const owners = await loadOwners();
  return {
    id: row.id,
    type: row.type as Activity["type"],
    subject: row.subject,
    content: row.content ?? undefined,
    occurredAt: row.occurredAt ?? row.createdAt ?? new Date().toISOString(),
    owner: ownerByIdSync(row.ownerId ?? "", owners),
    customerId: row.customerId ?? undefined,
    dealId: row.dealId ?? undefined,
    createdAt: row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updatedAt ?? new Date().toISOString(),
  };
}

export const activitiesService = {
  async list(params?: { dealId?: string }) {
    const result = await apiFetch<ApiActivity[]>(`/api/v1/activities${toQuery({ ...params, pageSize: 100 })}`);
    return Promise.all((result.data ?? []).map(mapActivity));
  },
  async create(input: ActivityInput) {
    const result = await apiFetch<ApiActivity>("/api/v1/activities", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return mapActivity(result.data);
  },
};
