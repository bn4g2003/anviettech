"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  ListPageProvider,
  useListPage,
} from "@/features/shared/hooks/use-list-page";
import { DealsPageHeader } from "./_components/deals-page-header";
import { DealsFilterBar } from "./_components/deals-filter-bar";
import { DealsTable } from "./_components/deals-table";
import { DealsKanban } from "./_components/deals-kanban";
import { DealFormDialog } from "./_components/deal-form-dialog";
import { DealDetailDrawer } from "./_components/deal-detail-drawer";
import { DealDeleteDialog } from "./_components/deal-delete-dialog";

const COLUMNS = [
  "code",
  "title",
  "customer",
  "stage",
  "value",
  "probability",
  "owner",
  "expectedCloseDate",
  "updatedAt",
  "actions",
];

function SyncUrlFilters() {
  const searchParams = useSearchParams();
  const { filters, setFilter } = useListPage();

  useEffect(() => {
    const customerId = searchParams.get("customerId");
    if (customerId && filters.customerId !== customerId) {
      setFilter("customerId", customerId);
    }
    const stage = searchParams.get("stage");
    if (stage && filters.stage !== stage) {
      setFilter("stage", stage);
    }
  }, [searchParams]);

  return null;
}

function DealsContent() {
  const { filters } = useListPage();
  const isKanban = filters.viewMode === "kanban";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Suspense fallback={null}>
        <SyncUrlFilters />
      </Suspense>
      <DealsPageHeader />
      <DealsFilterBar />
      {isKanban ? <DealsKanban /> : <DealsTable />}
      <DealFormDialog />
      <DealDetailDrawer />
      <DealDeleteDialog />
    </div>
  );
}

export default function DealsPage() {
  return (
    <ListPageProvider defaultColumns={COLUMNS} defaultFilters={{ viewMode: "list" }}>
      <DealsContent />
    </ListPageProvider>
  );
}
