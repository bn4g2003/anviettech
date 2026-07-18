import type { Task, TaskInput } from "@/features/tasks/types";
import { crmRepository } from "@/features/shared/repository/crm-repository";
import { createId } from "@/features/shared/utils/id";
import { nowIso, isSameDay } from "@/features/shared/utils/date";

export const tasksService = {
  list(): Task[] {
    return crmRepository.listTasks();
  },

  getById(id: string): Task | undefined {
    return crmRepository.listTasks().find((t) => t.id === id);
  },

  byCustomer(customerId: string): Task[] {
    return crmRepository.listTasks().filter((t) => t.customerId === customerId);
  },

  search(
    query: string,
    filters?: { status?: string; type?: string; ownerId?: string; view?: string },
  ) {
    const q = query.trim().toLowerCase();
    const today = new Date();
    return crmRepository.listTasks().filter((t) => {
      if (filters?.status && t.status !== filters.status) return false;
      if (filters?.type && t.type !== filters.type) return false;
      if (filters?.ownerId && t.owner.id !== filters.ownerId) return false;
      if (filters?.view === "today" && !isSameDay(t.dueAt, today)) return false;
      if (filters?.view === "overdue") {
        if (t.status !== "open" || new Date(t.dueAt) >= today) return false;
      }
      if (!q) return true;
      return t.title.toLowerCase().includes(q);
    });
  },

  create(input: TaskInput): Task {
    const now = nowIso();
    const row: Task = { ...input, id: createId("task"), createdAt: now, updatedAt: now };
    crmRepository.saveTasks([row, ...crmRepository.listTasks()]);
    return row;
  },

  update(id: string, patch: Partial<TaskInput>): Task {
    const rows = crmRepository.listTasks();
    const idx = rows.findIndex((t) => t.id === id);
    if (idx < 0) throw new Error("Không tìm thấy công việc");
    const next = { ...rows[idx], ...patch, updatedAt: nowIso() };
    const copy = [...rows];
    copy[idx] = next;
    crmRepository.saveTasks(copy);
    return next;
  },

  remove(id: string): void {
    crmRepository.saveTasks(crmRepository.listTasks().filter((t) => t.id !== id));
  },

  removeMany(ids: string[]): void {
    const set = new Set(ids);
    crmRepository.saveTasks(crmRepository.listTasks().filter((t) => !set.has(t.id)));
  },
};
