"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { tasksService } from "@/features/tasks/services/tasks-service";
import type { Task, TaskInput } from "@/features/tasks/types";

function viewToDue(view?: string) {
  if (view === "today" || view === "overdue" || view === "upcoming") return view;
  return undefined;
}

export function useTasks(filters?: {
  query?: string;
  status?: string;
  ownerId?: string;
  customerId?: string;
  dealId?: string;
  type?: string;
  view?: string;
  scope?: string;
  enabled?: boolean;
}) {
  const [rows, setRows] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (filters?.enabled === false) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await tasksService.list({
        search: filters?.query,
        status: filters?.status,
        ownerId: filters?.ownerId,
        customerId: filters?.customerId,
        dealId: filters?.dealId,
        type: filters?.type,
        due: viewToDue(filters?.view),
        scope: filters?.scope === "my" || filters?.view === "my" ? "my" : undefined,
      });
      setRows(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error loading tasks:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filters?.query, filters?.status, filters?.ownerId, filters?.customerId, filters?.dealId, filters?.type, filters?.view, filters?.scope, filters?.enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  return {
    rows,
    all: rows,
    loading,
    reload,
    getById: (id: string) => byId.get(id),
    create: async (input: TaskInput) => {
      const row = await tasksService.create(input);
      await reload();
      return row;
    },
    update: async (id: string, patch: Partial<TaskInput>) => {
      const row = await tasksService.update(id, patch);
      await reload();
      return row;
    },
    remove: async (id: string) => {
      await tasksService.remove(id);
      await reload();
    },
    removeMany: async (ids: string[]) => {
      await tasksService.removeMany(ids);
      await reload();
    },
  };
}
