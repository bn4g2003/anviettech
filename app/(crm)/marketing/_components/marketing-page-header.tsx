"use client";

import { AppHeader } from "@/components/shell/app-header";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useListPage } from "@/features/shared/hooks/use-list-page";

export function MarketingPageHeader() {
  const { setCreateOpen, selectedIds, clearSelection } = useListPage();
  const { canCreate } = useCurrentUser();
  const allowed = canCreate("campaigns");

  return (
    <AppHeader
      moduleLabel="Marketing"
      onCreate={allowed ? () => setCreateOpen(true) : undefined}
      createLabel="Tạo chiến dịch"
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
