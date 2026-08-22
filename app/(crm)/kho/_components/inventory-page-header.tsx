"use client";

import { AppHeader } from "@/components/shell/app-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useListPage } from "@/features/shared/hooks/use-list-page";

export type InventoryTab = "stock" | "in" | "out" | "transfer";

type Props = {
  tab: InventoryTab;
  onTabChange: (v: InventoryTab) => void;
};

const CREATE_LABEL: Record<Exclude<InventoryTab, "stock">, string> = {
  in: "Tạo phiếu nhập",
  out: "Tạo phiếu xuất",
  transfer: "Tạo điều chuyển",
};

export function InventoryPageHeader({ tab, onTabChange }: Props) {
  const { setCreateOpen } = useListPage();
  const { canCreate: userCanCreate } = useCurrentUser();
  const canCreate = tab !== "stock" && userCanCreate("inventory");

  return (
    <AppHeader
      moduleLabel="Kho"
      onCreate={canCreate ? () => setCreateOpen(true) : undefined}
      createLabel={canCreate ? CREATE_LABEL[tab] : undefined}
      viewModes={
        <Tabs value={tab} onValueChange={(v) => onTabChange(v as InventoryTab)}>
          <TabsList>
            <TabsTrigger value="stock">Tồn kho</TabsTrigger>
            <TabsTrigger value="in">Phiếu nhập</TabsTrigger>
            <TabsTrigger value="out">Phiếu xuất</TabsTrigger>
            <TabsTrigger value="transfer">Điều chuyển</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    />
  );
}
