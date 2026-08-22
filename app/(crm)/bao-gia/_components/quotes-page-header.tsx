"use client";

import { AppHeader } from "@/components/shell/app-header";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { BaoGiaTabs } from "./bao-gia-tabs";

type Props = {
  tab: "quotes" | "orders";
  onTabChange: (v: "quotes" | "orders") => void;
};

export function QuotesPageHeader({ tab, onTabChange }: Props) {
  const { setCreateOpen, selectedIds, clearSelection } = useListPage();
  const { canCreate } = useCurrentUser();
  const allowed = tab === "quotes" && canCreate("quotes");

  return (
    <AppHeader
      moduleLabel="Báo giá"
      viewModes={<BaoGiaTabs value={tab} onChange={onTabChange} />}
      onCreate={allowed ? () => setCreateOpen(true) : undefined}
      createLabel="Tạo báo giá"
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
