"use client";

import { AppHeader } from "@/components/shell/app-header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { resetDemoData } from "@/features/shared/workflows/reset-demo";
import { RotateCcw } from "lucide-react";

export function MarketingPageHeader() {
  const { setCreateOpen, selectedIds, clearSelection } = useListPage();
  const { toast } = useToast();

  return (
    <AppHeader
      moduleLabel="Marketing"
      onCreate={() => setCreateOpen(true)}
      createLabel="Tạo chiến dịch"
      secondaryAction={
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 ? (
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Bỏ chọn ({selectedIds.length})
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetDemoData();
              toast("Đã khôi phục dữ liệu demo", "success");
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset demo
          </Button>
        </div>
      }
    />
  );
}
