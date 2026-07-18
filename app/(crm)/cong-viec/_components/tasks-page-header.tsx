"use client";

import { AppHeader } from "@/components/shell/app-header";
import { Button } from "@/components/ui/button";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { cn } from "@/lib/cn";
import { CalendarDays, Columns3, List } from "lucide-react";

export function TasksPageHeader() {
  const { setCreateOpen, selectedIds, clearSelection, filters, setFilter } =
    useListPage();
  const viewMode = filters.viewMode === "week" ? "week" : filters.viewMode === "kanban" ? "kanban" : "list";

  return (
    <AppHeader
      moduleLabel="Công việc"
      viewLabel={viewMode === "week" ? "Tuần" : viewMode === "kanban" ? "Kanban" : "Danh sách"}
      onCreate={() => setCreateOpen(true)}
      createLabel="Tạo"
      viewModes={
        <div className="inline-flex items-center gap-0.5 rounded-md border border-border p-0.5">
          <button
            type="button"
            className={cn(
              "inline-flex h-6 items-center gap-1 rounded px-2 text-xs font-medium",
              viewMode === "list" ? "bg-muted-bg" : "text-muted hover:bg-muted-bg/60",
            )}
            onClick={() => setFilter("viewMode", "list")}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
          <button type="button" className={cn("inline-flex h-6 items-center gap-1 rounded px-2 text-xs font-medium", viewMode === "kanban" ? "bg-muted-bg" : "text-muted hover:bg-muted-bg/60")} onClick={() => setFilter("viewMode", "kanban")}><Columns3 className="h-3.5 w-3.5" />Kanban</button>
          <button
            type="button"
            className={cn(
              "inline-flex h-6 items-center gap-1 rounded px-2 text-xs font-medium",
              viewMode === "week" ? "bg-muted-bg" : "text-muted hover:bg-muted-bg/60",
            )}
            onClick={() => setFilter("viewMode", "week")}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Tuần
          </button>
        </div>
      }
      secondaryAction={
        selectedIds.length > 0 ? (
          <Button variant="outline" size="sm" onClick={clearSelection}>
            Bỏ chọn ({selectedIds.length})
          </Button>
        ) : null
      }
    />
  );
}
