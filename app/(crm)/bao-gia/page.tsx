"use client";

import { useState } from "react";
import { ListPageProvider } from "@/features/shared/hooks/use-list-page";
import { QuotesPageHeader } from "./_components/quotes-page-header";
import { QuotesFilterBar } from "./_components/quotes-filter-bar";
import { QuotesTable } from "./_components/quotes-table";
import { QuoteFormDialog } from "./_components/quote-form-dialog";
import { QuoteDetailDrawer } from "./_components/quote-detail-drawer";
import { QuoteDeleteDialog } from "./_components/quote-delete-dialog";
import { OrdersFilterBar } from "./_components/orders-filter-bar";
import { OrdersTable } from "./_components/orders-table";
import { OrderDetailDrawer } from "./_components/order-detail-drawer";
import { OrderDeleteDialog } from "./_components/order-delete-dialog";

const QUOTE_COLUMNS = [
  "code",
  "customer",
  "deal",
  "status",
  "total",
  "validUntil",
  "owner",
  "actions",
];

const ORDER_COLUMNS = [
  "code",
  "customer",
  "quoteId",
  "status",
  "total",
  "owner",
  "actions",
];

export default function BaoGiaPage() {
  const [tab, setTab] = useState<"quotes" | "orders">("quotes");

  if (tab === "orders") {
    return (
      <ListPageProvider defaultColumns={ORDER_COLUMNS}>
        <div className="flex h-full min-h-0 flex-col">
          <QuotesPageHeader tab={tab} onTabChange={setTab} />
          <OrdersFilterBar />
          <OrdersTable />
          <OrderDetailDrawer />
          <OrderDeleteDialog />
        </div>
      </ListPageProvider>
    );
  }

  return (
    <ListPageProvider defaultColumns={QUOTE_COLUMNS}>
      <div className="flex h-full min-h-0 flex-col">
        <QuotesPageHeader tab={tab} onTabChange={setTab} />
        <QuotesFilterBar />
        <QuotesTable />
        <QuoteFormDialog />
        <QuoteDetailDrawer />
        <QuoteDeleteDialog />
      </div>
    </ListPageProvider>
  );
}
