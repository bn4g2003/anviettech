import type { Contract, ContractInput } from "@/features/contracts/types";
import { crmRepository } from "@/features/shared/repository/crm-repository";
import { createId } from "@/features/shared/utils/id";
import { nowIso } from "@/features/shared/utils/date";

function nextCode(rows: Contract[]): string {
  const max = rows.reduce((acc, r) => {
    const n = Number(r.code.replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `HD-${String(max + 1).padStart(4, "0")}`;
}

export const contractsService = {
  list(): Contract[] {
    return crmRepository.listContracts();
  },

  getById(id: string): Contract | undefined {
    return crmRepository.listContracts().find((c) => c.id === id);
  },

  byCustomer(customerId: string): Contract[] {
    return crmRepository.listContracts().filter((c) => c.customerId === customerId);
  },

  search(query: string, filters?: { status?: string; customerId?: string }) {
    const q = query.trim().toLowerCase();
    return crmRepository.listContracts().filter((c) => {
      if (filters?.status && c.status !== filters.status) return false;
      if (filters?.customerId && c.customerId !== filters.customerId) return false;
      if (!q) return true;
      return c.code.toLowerCase().includes(q);
    });
  },

  create(input: ContractInput): Contract {
    const rows = crmRepository.listContracts();
    const now = nowIso();
    const row: Contract = {
      ...input,
      id: createId("ctr"),
      code: input.code ?? nextCode(rows),
      createdAt: now,
      updatedAt: now,
    };
    crmRepository.saveContracts([row, ...rows]);
    return row;
  },

  update(id: string, patch: Partial<ContractInput>): Contract {
    const rows = crmRepository.listContracts();
    const idx = rows.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error("Không tìm thấy hợp đồng");
    const next = { ...rows[idx], ...patch, updatedAt: nowIso() };
    const copy = [...rows];
    copy[idx] = next;
    crmRepository.saveContracts(copy);
    return next;
  },

  remove(id: string): void {
    crmRepository.saveContracts(crmRepository.listContracts().filter((c) => c.id !== id));
  },

  removeMany(ids: string[]): void {
    const set = new Set(ids);
    crmRepository.saveContracts(crmRepository.listContracts().filter((c) => !set.has(c.id)));
  },
};
