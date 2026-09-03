"use client";

import { AppHeader } from "@/components/shell/app-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useListPage } from "@/features/shared/hooks/use-list-page";

export type FinanceTab = "invoices" | "payments" | "debts" | "expenses" | "revenue" | "reports";

type Props = {
  tab: FinanceTab;
  onTabChange: (v: FinanceTab) => void;
};

export function FinancePageHeader({ tab, onTabChange }: Props) {
  const { setCreateOpen } = useListPage();
  const { canCreate: userCanCreate } = useCurrentUser();
  const canCreate = (tab === "payments" || tab === "expenses" || tab === "revenue") && userCanCreate("finance");

  return (
    <AppHeader
      moduleLabel="Tài chính"
      onCreate={canCreate ? () => setCreateOpen(true) : undefined}
      createLabel={tab === "expenses" ? "Ghi chi phí" : tab === "revenue" ? "Ghi doanh thu" : "Ghi thanh toán"}
      viewModes={
        <Tabs value={tab} onValueChange={(v) => onTabChange(v as FinanceTab)}>
          <TabsList>
            <TabsTrigger value="invoices">Hóa đơn</TabsTrigger>
            <TabsTrigger value="payments">Thanh toán</TabsTrigger>
            <TabsTrigger value="debts">Công nợ</TabsTrigger>
            <TabsTrigger value="expenses">Chi phí</TabsTrigger>
            <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
            <TabsTrigger value="reports">Báo cáo</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    />
  );
}
