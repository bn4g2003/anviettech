"use client";

import { AppHeader } from "@/components/shell/app-header";
import { Button } from "@/components/ui/button";
import { useListPage } from "@/features/shared/hooks/use-list-page";

export function CustomersPageHeader() {
  const { setCreateOpen, selectedIds, clearSelection } = useListPage();

  return (
    <AppHeader
      moduleLabel="Khách hàng"
      onCreate={() => setCreateOpen(true)}
      createLabel="Tạo"
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
