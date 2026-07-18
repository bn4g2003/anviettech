"use client";

import { AppHeader } from "@/components/shell/app-header";
import { Button } from "@/components/ui/button";
import { useListPage } from "@/features/shared/hooks/use-list-page";

export function ContractsPageHeader() {
  const { setCreateOpen, selectedIds, clearSelection } = useListPage();

  return (
    <AppHeader
      moduleLabel="Hợp đồng"
      onCreate={() => setCreateOpen(true)}
      createLabel="Tạo hợp đồng"
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
