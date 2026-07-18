"use client";

import { AppHeader } from "@/components/shell/app-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useListPage } from "@/features/shared/hooks/use-list-page";

export type FinanceTab = "invoices" | "payments" | "debts";

type Props = {
  tab: FinanceTab;
  onTabChange: (v: FinanceTab) => void;
};

export function FinancePageHeader({ tab, onTabChange }: Props) {
  const { setCreateOpen } = useListPage();
  const canCreate = tab === "invoices" || tab === "payments";

  return (
    <AppHeader
      moduleLabel="Tài chính"
      onCreate={canCreate ? () => setCreateOpen(true) : undefined}
      createLabel="Ghi thanh toán"
      viewModes={
        <Tabs value={tab} onValueChange={(v) => onTabChange(v as FinanceTab)}>
          <TabsList>
            <TabsTrigger value="invoices">Hóa đơn</TabsTrigger>
            <TabsTrigger value="payments">Thanh toán</TabsTrigger>
            <TabsTrigger value="debts">Công nợ</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    />
  );
}
