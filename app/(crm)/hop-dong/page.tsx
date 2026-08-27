"use client";

import { ListPageProvider } from "@/features/shared/hooks/use-list-page";
import { ContractsPageHeader } from "./_components/contracts-page-header";
import { ContractsFilterBar } from "./_components/contracts-filter-bar";
import { ContractsTable } from "./_components/contracts-table";
import { ContractDetailDrawer } from "./_components/contract-detail-drawer";
import { ContractFormDialog } from "./_components/contract-form-dialog";

const COLUMNS = [
  "code",
  "customer",
  "quoteId",
  "status",
  "value",
  "startDate",
  "endDate",
  "owner",
  "actions",
];

export default function HopDongPage() {
  return (
    <ListPageProvider defaultColumns={COLUMNS}>
      <div className="flex h-full min-h-0 flex-col">
        <ContractsPageHeader />
        <ContractsFilterBar />
        <ContractsTable />
        <ContractDetailDrawer />
        <ContractFormDialog />
      </div>
    </ListPageProvider>
  );
}
