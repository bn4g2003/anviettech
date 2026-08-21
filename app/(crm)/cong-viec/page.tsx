"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  ListPageProvider,
  useListPage,
} from "@/features/shared/hooks/use-list-page";
import { TasksPageHeader } from "./_components/tasks-page-header";
import { TasksFilterBar } from "./_components/tasks-filter-bar";
import { TasksTable } from "./_components/tasks-table";
import { TasksWeekStrip } from "./_components/tasks-week-strip";
import { TasksKanban } from "./_components/tasks-kanban";
import { TaskFormDialog } from "./_components/task-form-dialog";
import { TaskDetailDrawer } from "./_components/task-detail-drawer";
import { TaskDeleteDialog } from "./_components/task-delete-dialog";

const COLUMNS = [
  "title",
  "type",
  "status",
  "dueAt",
  "owner",
  "customer",
  "deal",
  "actions",
];

function SyncUrlFilters() {
  const searchParams = useSearchParams();
  const { filters, setFilter } = useListPage();

  useEffect(() => {
    const view = searchParams.get("view");
    if (view && filters.view !== view) {
      setFilter("view", view);
    }
  }, [searchParams]);

  return null;
}

function TasksContent() {
  const { filters } = useListPage();
  const isWeek = filters.viewMode === "week";
  const isKanban = filters.viewMode === "kanban";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Suspense fallback={null}>
        <SyncUrlFilters />
      </Suspense>
      <TasksPageHeader />
      <TasksFilterBar />
      {isKanban ? <TasksKanban /> : isWeek ? <TasksWeekStrip /> : <TasksTable />}
      <TaskFormDialog />
      <TaskDetailDrawer />
      <TaskDeleteDialog />
    </div>
  );
}

export default function CongViecPage() {
  return (
    <ListPageProvider defaultColumns={COLUMNS} defaultFilters={{ viewMode: "list" }}>
      <Suspense fallback={<div className="p-4 text-sm text-muted">Đang tải...</div>}>
        <TasksContent />
      </Suspense>
    </ListPageProvider>
  );
}
