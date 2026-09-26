"use client";

import { AppHeader } from "@/components/shell/app-header";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { cn } from "@/lib/cn";
import { BarChart3, Megaphone } from "lucide-react";

export function MarketingPageHeader() {
  const { setCreateOpen, selectedIds, clearSelection, filters, setFilter } = useListPage();
  const { canCreate } = useCurrentUser();
  const allowed = canCreate("campaigns");
  const viewMode = filters.viewMode === "analytics" ? "analytics" : "campaigns";

  return (
    <AppHeader
      moduleLabel="Marketing"
      viewLabel={viewMode === "analytics" ? "Khách hàng & Phễu MKT" : "Chiến dịch"}
      onCreate={allowed ? () => setCreateOpen(true) : undefined}
      createLabel="Tạo chiến dịch"
      viewModes={
        <div className="inline-flex items-center gap-0.5 rounded-md border border-border p-0.5">
          <button
            type="button"
            className={cn(
              "inline-flex h-6 items-center gap-1 rounded px-2 text-xs font-medium transition-colors",
              viewMode === "campaigns"
                ? "bg-muted-bg text-foreground font-semibold shadow-2xs"
                : "text-muted hover:bg-muted-bg/60",
            )}
            onClick={() => setFilter("viewMode", "campaigns")}
          >
            <Megaphone className="h-3.5 w-3.5" />
            Chiến dịch
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex h-6 items-center gap-1 rounded px-2 text-xs font-medium transition-colors",
              viewMode === "analytics"
                ? "bg-muted-bg text-foreground font-semibold shadow-2xs"
                : "text-muted hover:bg-muted-bg/60",
            )}
            onClick={() => setFilter("viewMode", "analytics")}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Khách hàng & Phễu MKT
          </button>
        </div>
      }
      secondaryAction={
        viewMode === "campaigns" && selectedIds.length > 0 ? (
          <Button variant="outline" size="sm" onClick={clearSelection}>
            Bỏ chọn ({selectedIds.length})
          </Button>
        ) : null
      }
    />
  );
}
