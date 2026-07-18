"use client";

import { FilterBar } from "@/components/datagrid/filter-bar";
import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { Filter, RefreshCw, ArrowUpDown } from "lucide-react";

const COLUMN_DEFS = [
  { id: "customer", label: "Khách hàng" },
  { id: "debt", label: "Công nợ" },
  { id: "invoiceCount", label: "Số HĐ" },
];

export function DebtsFilterBar() {
  const {
    query,
    setQuery,
    visibleColumns,
    setVisibleColumns,
    toggleSort,
  } = useListPage();

  return (
    <FilterBar
      filters={
        <Input
          className="w-44"
          placeholder="Tên khách hàng..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      }
      actions={
        <>
          <Button variant="outline" size="icon" title="Làm mới">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-3.5 w-3.5" />
            Lọc
          </Button>
          <Button variant="outline" size="sm" onClick={() => toggleSort("debt")}>
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sắp xếp
          </Button>
          <ColumnToggle
            columns={COLUMN_DEFS}
            visibleIds={visibleColumns}
            onChange={setVisibleColumns}
          />
        </>
      }
    />
  );
}
