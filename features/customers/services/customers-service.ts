import type { Customer, CustomerInput } from "@/features/customers/types";
import { crmRepository } from "@/features/shared/repository/crm-repository";
import { createId } from "@/features/shared/utils/id";
import { nowIso } from "@/features/shared/utils/date";

function nextCode(rows: Customer[]): string {
  const max = rows.reduce((acc, r) => {
    const n = Number(r.code.replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `KH-${String(max + 1).padStart(4, "0")}`;
}

export const customersService = {
  list(): Customer[] {
    return crmRepository.listCustomers();
  },

  getById(id: string): Customer | undefined {
    return crmRepository.listCustomers().find((c) => c.id === id);
  },

  search(query: string, filters?: { status?: string; type?: string; ownerId?: string }) {
    const q = query.trim().toLowerCase();
    return crmRepository.listCustomers().filter((c) => {
      if (filters?.status && c.status !== filters.status) return false;
      if (filters?.type && c.type !== filters.type) return false;
      if (filters?.ownerId && c.owner.id !== filters.ownerId) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
      );
    });
  },

  create(input: CustomerInput): Customer {
    const rows = crmRepository.listCustomers();
    const now = nowIso();
    const row: Customer = {
      ...input,
      id: createId("cus"),
      code: input.code ?? nextCode(rows),
      createdAt: now,
      updatedAt: now,
    };
    crmRepository.saveCustomers([row, ...rows]);
    return row;
  },

  update(id: string, patch: Partial<CustomerInput>): Customer {
    const rows = crmRepository.listCustomers();
    const idx = rows.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error("Không tìm thấy khách hàng");
    const next = { ...rows[idx], ...patch, updatedAt: nowIso() };
    const copy = [...rows];
    copy[idx] = next;
    crmRepository.saveCustomers(copy);
    return next;
  },

  remove(id: string): void {
    crmRepository.saveCustomers(crmRepository.listCustomers().filter((c) => c.id !== id));
  },

  removeMany(ids: string[]): void {
    const set = new Set(ids);
    crmRepository.saveCustomers(crmRepository.listCustomers().filter((c) => !set.has(c.id)));
  },
};
