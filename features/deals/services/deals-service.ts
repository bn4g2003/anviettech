import type { Deal, DealInput, DealStage } from "@/features/deals/types";
import { DEAL_STAGE_META } from "@/features/deals/types";
import { crmRepository } from "@/features/shared/repository/crm-repository";
import { createId } from "@/features/shared/utils/id";
import { nowIso, daysFromNow } from "@/features/shared/utils/date";
import { tasksService } from "@/features/tasks/services/tasks-service";

function nextCode(rows: Deal[]): string {
  const max = rows.reduce((acc, r) => {
    const n = Number(r.code.replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `CH-${String(max + 1).padStart(4, "0")}`;
}

export const dealsService = {
  list(): Deal[] {
    return crmRepository.listDeals();
  },

  getById(id: string): Deal | undefined {
    return crmRepository.listDeals().find((d) => d.id === id);
  },

  byCustomer(customerId: string): Deal[] {
    return crmRepository.listDeals().filter((d) => d.customerId === customerId);
  },

  search(query: string, filters?: { stage?: DealStage; ownerId?: string; customerId?: string }) {
    const q = query.trim().toLowerCase();
    return crmRepository.listDeals().filter((d) => {
      if (filters?.stage && d.stage !== filters.stage) return false;
      if (filters?.ownerId && d.owner.id !== filters.ownerId) return false;
      if (filters?.customerId && d.customerId !== filters.customerId) return false;
      if (!q) return true;
      return d.title.toLowerCase().includes(q) || d.code.toLowerCase().includes(q);
    });
  },

  create(input: DealInput, opts?: { createFollowup?: boolean }): Deal {
    const rows = crmRepository.listDeals();
    const now = nowIso();
    const stage = input.stage;
    const row: Deal = {
      ...input,
      id: createId("deal"),
      code: input.code ?? nextCode(rows),
      probability: input.probability ?? DEAL_STAGE_META[stage].probability,
      createdAt: now,
      updatedAt: now,
    };
    crmRepository.saveDeals([row, ...rows]);

    if (opts?.createFollowup !== false) {
      tasksService.create({
        title: `Follow-up: ${row.title}`,
        type: "followup",
        status: "open",
        dueAt: daysFromNow(3),
        owner: row.owner,
        customerId: row.customerId,
        dealId: row.id,
      });
    }
    return row;
  },

  update(id: string, patch: Partial<DealInput>): Deal {
    const rows = crmRepository.listDeals();
    const idx = rows.findIndex((d) => d.id === id);
    if (idx < 0) throw new Error("Không tìm thấy cơ hội");
    const stage = patch.stage ?? rows[idx].stage;
    const next: Deal = {
      ...rows[idx],
      ...patch,
      stage,
      probability: DEAL_STAGE_META[stage].probability,
      updatedAt: nowIso(),
    };
    const copy = [...rows];
    copy[idx] = next;
    crmRepository.saveDeals(copy);
    return next;
  },

  setStage(id: string, stage: DealStage): Deal {
    return this.update(id, { stage });
  },

  remove(id: string): void {
    crmRepository.saveDeals(crmRepository.listDeals().filter((d) => d.id !== id));
  },

  removeMany(ids: string[]): void {
    const set = new Set(ids);
    crmRepository.saveDeals(crmRepository.listDeals().filter((d) => !set.has(d.id)));
  },
};
