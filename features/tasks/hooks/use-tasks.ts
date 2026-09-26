"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { tasksService } from "@/features/tasks/services/tasks-service";
import type { Task, TaskInput } from "@/features/tasks/types";

function parseViews(view?: string) {
  if (!view) return [];
  return view.split(",").map((s) => s.trim()).filter(Boolean);
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
      const views = parseViews(filters?.view);
      const isSingleDue = views.length === 1 && (views[0] === "today" || views[0] === "overdue" || views[0] === "upcoming");
      let list = await tasksService.list({
        search: filters?.query,
        status: filters?.status,
        ownerId: filters?.ownerId,
        customerId: filters?.customerId,
        dealId: filters?.dealId,
        type: filters?.type,
        due: isSingleDue ? (views[0] as "today" | "overdue" | "upcoming") : undefined,
        scope: filters?.scope === "my" || views.includes("my") ? "my" : undefined,
      });

      if (Array.isArray(list) && views.length > 0 && !isSingleDue) {
        const todayStr = new Date().toISOString().slice(0, 10);
        list = list.filter((task) => {
          if (!task.dueAt) return views.includes("upcoming");
          const taskDate = task.dueAt.slice(0, 10);
          const isOverdue = taskDate < todayStr && task.status === "open";
          const isToday = taskDate === todayStr && task.status === "open";
          const isUpcoming = taskDate > todayStr && task.status === "open";
          if (views.includes("overdue") && isOverdue) return true;
          if (views.includes("today") && isToday) return true;
          if (views.includes("upcoming") && isUpcoming) return true;
          if (views.includes("my")) return true;
          return false;
        });
      }

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
