"use client";

import { ListPageProvider } from "@/features/shared/hooks/use-list-page";
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

export default function CustomersPage() {
  return (
    <ListPageProvider defaultColumns={COLUMNS}>
      <div className="flex h-full min-h-0 flex-col">
        <CustomersPageHeader />
        <CustomersFilterBar />
        <CustomersTable />
        <CustomerFormDialog />
        <CustomerDetailDrawer />
        <CustomerDeleteDialog />
      </div>
    </ListPageProvider>
  );
}
