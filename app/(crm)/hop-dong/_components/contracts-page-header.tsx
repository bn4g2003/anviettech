"use client";

import { AppHeader } from "@/components/shell/app-header";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";

export function ContractsPageHeader() {
  const list = useListPage();
  const { canCreate } = useCurrentUser();
  return (
    <AppHeader
      moduleLabel="Hợp đồng"
      onCreate={canCreate("contracts") ? () => list.setCreateOpen(true) : undefined}
      createLabel="Tạo hợp đồng"
    />
  );
}
