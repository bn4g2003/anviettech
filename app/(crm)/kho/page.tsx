"use client";

import { useState } from "react";
import { ListPageProvider } from "@/features/shared/hooks/use-list-page";
import { InventoryPageHeader } from "./_components/inventory-page-header";
import { StockLevelsTable } from "./_components/stock-levels-table";
import { StockLevelsFilterBar } from "./_components/stock-levels-filter-bar";
import { StockMovesFilterBar } from "./_components/stock-moves-filter-bar";
import { StockMovesTable } from "./_components/stock-moves-table";
import { StockMoveFormDialog } from "./_components/stock-move-form-dialog";
import { StockMoveDetailDrawer } from "./_components/stock-move-detail-drawer";
import { StockMoveDeleteDialog } from "./_components/stock-move-delete-dialog";
import type { InventoryTab } from "./_components/inventory-page-header";
import type { StockMoveType } from "@/features/inventory/types";

const STOCK_COLUMNS = ["sku", "name", "qty", "minStock", "status", "category"];

const MOVE_COLUMNS = [
  "code",
  "status",
  "reason",
  "warehouse",
  "orderId",
  "lines",
  "owner",
  "actions",
];

export default function KhoPage() {
  const [tab, setTab] = useState<InventoryTab>("stock");

  if (tab === "stock") {
    return (
      <ListPageProvider defaultColumns={STOCK_COLUMNS}>
        <div className="flex h-full min-h-0 flex-col">
          <InventoryPageHeader tab={tab} onTabChange={setTab} />
          <StockLevelsFilterBar />
          <StockLevelsTable />
        </div>
      </ListPageProvider>
    );
  }

  const moveType = tab as StockMoveType;

  return (
    <ListPageProvider
      key={tab}
      defaultColumns={MOVE_COLUMNS}
      defaultFilters={{ type: moveType }}
    >
      <div className="flex h-full min-h-0 flex-col">
        <InventoryPageHeader tab={tab} onTabChange={setTab} />
        <StockMovesFilterBar />
        <StockMovesTable moveType={moveType} />
        <StockMoveFormDialog moveType={moveType} />
        <StockMoveDetailDrawer />
        <StockMoveDeleteDialog />
      </div>
    </ListPageProvider>
  );
}
