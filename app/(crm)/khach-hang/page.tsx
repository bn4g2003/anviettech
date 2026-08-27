"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ListPageProvider, useListPage } from "@/features/shared/hooks/use-list-page";
import { CustomersPageHeader } from "./_components/customers-page-header";
import { CustomersFilterBar } from "./_components/customers-filter-bar";
import { CustomersTable } from "./_components/customers-table";
import { CustomerFormDialog } from "./_components/customer-form-dialog";
import { CustomerDetailDrawer } from "./_components/customer-detail-drawer";
import { CustomerDeleteDialog } from "./_components/customer-delete-dialog";

const COLUMNS = [
  "code",
  "name",
  "status",
  "email",
  "phone",
  "owner",
  "updatedAt",
  "debt",
  "actions",
];

function SyncUrlFilters() {
  const searchParams = useSearchParams();
  const { filters, setFilter } = useListPage();

  useEffect(() => {
    const view = searchParams.get("view");
    if (view && filters.view !== view) setFilter("view", view);
  }, [searchParams]);

  return null;
}

function CustomersContent() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Suspense fallback={null}>
        <SyncUrlFilters />
      </Suspense>
      <CustomersPageHeader />
      <CustomersFilterBar />
      <CustomersTable />
      <CustomerFormDialog />
      <CustomerDetailDrawer />
      <CustomerDeleteDialog />
    </div>
  );
}

export default function CustomersPage() {
  return (
    <ListPageProvider defaultColumns={COLUMNS}>
      <Suspense fallback={<div className="p-4 text-sm text-muted">Đang tải...</div>}>
        <CustomersContent />
      </Suspense>
    </ListPageProvider>
  );
}
