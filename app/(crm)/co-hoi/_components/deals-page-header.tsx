"use client";

import { AppHeader } from "@/components/shell/app-header";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { cn } from "@/lib/cn";
import { Kanban, List } from "lucide-react";

export function DealsPageHeader() {
  const { setCreateOpen, filters, setFilter } = useListPage();
  const { canCreate } = useCurrentUser();
  const viewMode = filters.viewMode === "kanban" ? "kanban" : "list";
  const allowed = canCreate("deals");

  return (
    <AppHeader
      moduleLabel="Cơ hội"
      viewLabel={viewMode === "kanban" ? "Kanban" : "Danh sách"}
      onCreate={allowed ? () => setCreateOpen(true) : undefined}
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
            Danh sách
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex h-6 items-center gap-1 rounded px-2 text-xs font-medium",
              viewMode === "kanban" ? "bg-muted-bg" : "text-muted hover:bg-muted-bg/60",
            )}
            onClick={() => setFilter("viewMode", "kanban")}
          >
            <Kanban className="h-3.5 w-3.5" />
            Kanban
          </button>
        </div>
      }
      secondaryAction={
        filters.customerId ? (
          <Button variant="outline" size="sm" onClick={() => setFilter("customerId", "")}>
            Bỏ lọc KH
          </Button>
        ) : null
      }
    />
  );
}
