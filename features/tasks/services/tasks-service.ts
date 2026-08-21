import { apiFetch, toQuery } from "@/lib/api-client";
import type { Task, TaskInput, TaskStatus, TaskType } from "@/features/tasks/types";
import { loadOwners, ownerByIdSync } from "@/features/shared/api/owners";

type ApiTask = {
  id: string; title: string; type: string; status: string; dueAt?: string | null;
  ownerId?: string | null; customerId?: string | null; dealId?: string | null; notes?: string | null;
  createdAt?: string; updatedAt?: string;
};

async function mapTask(row: ApiTask): Promise<Task> {
  const owners = await loadOwners();
  return {
    id: row.id,
    title: row.title,
    type: (row.type === "todo" ? "followup" : row.type) as TaskType,
    status: row.status as TaskStatus,
    dueAt: row.dueAt ?? "",
    owner: ownerByIdSync(row.ownerId ?? "", owners),
    customerId: row.customerId ?? undefined,
    dealId: row.dealId ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updatedAt ?? new Date().toISOString(),
  };
}

export const tasksService = {
  async list(params?: {
    search?: string;
    status?: string;
    customerId?: string;
    ownerId?: string;
    type?: string;
    due?: string;
    scope?: string;
  }) {
    const result = await apiFetch<ApiTask[]>(`/api/v1/tasks${toQuery({ ...params, pageSize: 100 })}`);
    return Promise.all((result.data ?? []).map(mapTask));
  },
  async create(input: TaskInput) {
    const result = await apiFetch<ApiTask>("/api/v1/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        type: input.type,
        dueAt: input.dueAt || undefined,
        ownerId: input.owner?.id?.trim() ? input.owner.id.trim() : undefined,
        customerId: input.customerId,
        dealId: input.dealId,
        notes: input.notes,
        status: input.status,
      }),
    });
    return mapTask(result.data);
  },
  async update(id: string, patch: Partial<TaskInput>) {
    const result = await apiFetch<ApiTask>(`/api/v1/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: patch.title,
        type: patch.type,
        status: patch.status,
        dueAt: patch.dueAt,
        ownerId: patch.owner?.id?.trim() ? patch.owner.id.trim() : undefined,
        notes: patch.notes,
      }),
    });
    return mapTask(result.data);
  },
  async remove(id: string) {
    await apiFetch(`/api/v1/tasks/${id}`, { method: "DELETE" });
  },
  async removeMany(ids: string[]) {
    await Promise.all(ids.map((id) => this.remove(id)));
  },
};
