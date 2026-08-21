import { apiFetch, toQuery } from "@/lib/api-client";
import type { Customer, CustomerInput } from "@/features/customers/types";
import { loadOwners, ownerByIdSync } from "@/features/shared/api/owners";

type ApiCustomer = {
  id: string;
  code: string;
  name: string;
  type: "company" | "individual";
  status: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  source?: string | null;
  ownerId?: string | null;
  campaignId?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

async function mapCustomer(row: ApiCustomer): Promise<Customer> {
  const owners = await loadOwners();
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.type,
    status: (row.status as Customer["status"]) || "active",
    email: row.email ?? "",
    phone: row.phone ?? "",
    address: row.address ?? "",
    source: row.source ?? "",
    owner: ownerByIdSync(row.ownerId ?? "", owners),
    campaignId: row.campaignId ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updatedAt ?? new Date().toISOString(),
  };
}

export const customersService = {
  async list(params?: { search?: string; status?: string; ownerId?: string; page?: number; pageSize?: number }) {
    const result = await apiFetch<ApiCustomer[]>(`/api/v1/customers${toQuery({ ...params, page: params?.page ?? 1, pageSize: params?.pageSize ?? 100 })}`);
    return Promise.all((result.data ?? []).map(mapCustomer));
  },

  async getById(id: string) {
    const result = await apiFetch<ApiCustomer>(`/api/v1/customers/${id}`);
    return mapCustomer(result.data);
  },

  async create(input: CustomerInput) {
    const result = await apiFetch<ApiCustomer>("/api/v1/customers", {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        type: input.type,
        email: input.email || undefined,
        phone: input.phone || undefined,
        address: input.address || undefined,
        source: input.source || undefined,
        ownerId: input.owner?.id?.trim() ? input.owner.id.trim() : undefined,
        notes: input.notes || undefined,
        campaignId: input.campaignId || undefined,
      }),
    });
    return mapCustomer(result.data);
  },

  async update(id: string, patch: Partial<CustomerInput>) {
    const result = await apiFetch<ApiCustomer>(`/api/v1/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: patch.name,
        type: patch.type,
        email: patch.email || undefined,
        phone: patch.phone || undefined,
        address: patch.address || undefined,
        source: patch.source || undefined,
        ownerId: patch.owner?.id?.trim() ? patch.owner.id.trim() : undefined,
        notes: patch.notes || undefined,
        status: patch.status,
        campaignId: patch.campaignId || undefined,
      }),
    });
    return mapCustomer(result.data);
  },

  async remove(id: string) {
    await apiFetch(`/api/v1/customers/${id}`, { method: "DELETE" });
  },

  async removeMany(ids: string[]) {
    await Promise.all(ids.map((id) => this.remove(id)));
  },

  async getWorkspace(id: string) {
    const result = await apiFetch<Record<string, unknown>>(`/api/v1/customers/${id}/workspace`);
    return result.data;
  },
};
