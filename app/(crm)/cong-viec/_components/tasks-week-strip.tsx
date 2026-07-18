"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatDate, isSameDay, startOfWeek } from "@/features/shared/utils/date";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import { TASK_TYPE_LABEL } from "@/features/tasks/types";
import { CalendarDays } from "lucide-react";
import { useMemo } from "react";
import { TaskStatusBadge } from "./task-status";

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function TasksWeekStrip() {
  const list = useListPage();
  const { rows } = useTasks({
    query: list.query,
    status: list.filters.status,
    type: list.filters.type,
    ownerId: list.filters.ownerId,
    view: list.filters.view,
  });

  const days = useMemo(() => {
    const start = startOfWeek();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, []);

  const byDay = useMemo(() => {
    return days.map((day) => rows.filter((t) => isSameDay(t.dueAt, day)));
  }, [days, rows]);

  const total = byDay.reduce((acc, list) => acc + list.length, 0);

  if (total === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyState
          icon={CalendarDays}
          title="Không có việc trong tuần"
          description="Thử đổi bộ lọc hoặc tạo công việc mới."
        />
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto p-3">
      <div className="grid min-w-[720px] grid-cols-7 gap-2">
        {days.map((day, i) => (
          <div
            key={day.toISOString()}
            className="flex min-h-[280px] flex-col rounded border border-border bg-white"
          >
            <div className="border-b border-border px-2 py-1.5">
              <p className="text-xs font-medium">{DAY_LABELS[i]}</p>
              <p className="text-[11px] text-muted">{formatDate(day.toISOString())}</p>
            </div>
            <ul className="flex flex-1 flex-col gap-1.5 overflow-auto p-1.5">
              {byDay[i].map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="w-full rounded border border-border px-1.5 py-1 text-left hover:bg-muted-bg/60"
                    onClick={() => list.setViewId(t.id)}
                  >
                    <p className="truncate text-xs font-medium">{t.title}</p>
                    <p className="truncate text-[10px] text-muted">
                      {TASK_TYPE_LABEL[t.type]} · {t.owner.name}
                    </p>
                    <div className="mt-0.5">
                      <TaskStatusBadge status={t.status} />
                    </div>
                  </button>
                </li>
              ))}
              {byDay[i].length === 0 ? (
                <li className="px-1 py-2 text-[10px] text-muted">Không có</li>
              ) : null}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
