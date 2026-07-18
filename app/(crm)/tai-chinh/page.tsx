"use client";

import { useState } from "react";
import { ListPageProvider } from "@/features/shared/hooks/use-list-page";
import { FinancePageHeader } from "./_components/finance-page-header";
import type { FinanceTab } from "./_components/finance-page-header";
import { InvoicesFilterBar } from "./_components/invoices-filter-bar";
import { InvoicesTable } from "./_components/invoices-table";
import { PaymentsFilterBar } from "./_components/payments-filter-bar";
import { PaymentsTable } from "./_components/payments-table";
import { DebtsFilterBar } from "./_components/debts-filter-bar";
import { DebtsTable } from "./_components/debts-table";
import { PaymentFormDialog } from "./_components/payment-form-dialog";
import { InvoiceDetailDrawer } from "./_components/invoice-detail-drawer";

const INVOICE_COLUMNS = [
  "code",
  "customer",
  "amount",
  "paidAmount",
  "status",
  "dueDate",
  "owner",
  "actions",
];

const PAYMENT_COLUMNS = [
  "code",
  "invoice",
  "customer",
  "amount",
  "method",
  "paidAt",
  "owner",
];

const DEBT_COLUMNS = ["customer", "debt", "invoiceCount"];

export default function TaiChinhPage() {
  const [tab, setTab] = useState<FinanceTab>("invoices");

  if (tab === "payments") {
    return (
      <ListPageProvider key="payments" defaultColumns={PAYMENT_COLUMNS}>
        <div className="flex h-full min-h-0 flex-col">
          <FinancePageHeader tab={tab} onTabChange={setTab} />
          <PaymentsFilterBar />
          <PaymentsTable />
          <PaymentFormDialog />
        </div>
      </ListPageProvider>
    );
  }

  if (tab === "debts") {
    return (
      <ListPageProvider key="debts" defaultColumns={DEBT_COLUMNS}>
        <div className="flex h-full min-h-0 flex-col">
          <FinancePageHeader tab={tab} onTabChange={setTab} />
          <DebtsFilterBar />
          <DebtsTable />
        </div>
      </ListPageProvider>
    );
  }

  return (
    <ListPageProvider key="invoices" defaultColumns={INVOICE_COLUMNS}>
      <div className="flex h-full min-h-0 flex-col">
        <FinancePageHeader tab={tab} onTabChange={setTab} />
        <InvoicesFilterBar />
        <InvoicesTable />
        <PaymentFormDialog />
        <InvoiceDetailDrawer />
      </div>
    </ListPageProvider>
  );
}
