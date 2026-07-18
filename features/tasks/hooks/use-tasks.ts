"use client";

import { useMemo } from "react";
import { useCrmStore } from "@/features/shared/store/crm-store";
import { tasksService } from "@/features/tasks/services/tasks-service";
import type { TaskInput } from "@/features/tasks/types";

export function useTasks(filters?: {
  query?: string;
  status?: string;
  type?: string;
  ownerId?: string;
  view?: string;
}) {
  const tasks = useCrmStore((s) => s.tasks);

  const rows = useMemo(() => {
    return tasksService.search(filters?.query ?? "", {
      status: filters?.status || undefined,
      type: filters?.type || undefined,
      ownerId: filters?.ownerId || undefined,
      view: filters?.view || undefined,
    });
  }, [tasks, filters?.query, filters?.status, filters?.type, filters?.ownerId, filters?.view]);

  return {
    rows,
    all: tasks,
    create: (input: TaskInput) => tasksService.create(input),
    update: (id: string, patch: Partial<TaskInput>) => tasksService.update(id, patch),
    remove: (id: string) => tasksService.remove(id),
    removeMany: (ids: string[]) => tasksService.removeMany(ids),
    getById: (id: string) => tasksService.getById(id),
  };
}
