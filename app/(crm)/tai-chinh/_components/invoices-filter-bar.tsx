"use client";

import { FilterBar } from "@/components/datagrid/filter-bar";
import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { Filter, RefreshCw, ArrowUpDown } from "lucide-react";

const COLUMN_DEFS = [
  { id: "code", label: "Mã" },
  { id: "customer", label: "Khách hàng" },
  { id: "amount", label: "Số tiền" },
  { id: "paidAmount", label: "Đã TT" },
  { id: "status", label: "Trạng thái" },
  { id: "dueDate", label: "Hạn TT" },
  { id: "owner", label: "Phụ trách" },
  { id: "actions", label: "Thao tác" },
];

export function InvoicesFilterBar() {
  const {
    query,
    setQuery,
    filters,
    setFilter,
    visibleColumns,
    setVisibleColumns,
    toggleSort,
  } = useListPage();

  return (
    <FilterBar
      filters={
        <>
          <Select
            value={filters.invoiceStatus ?? ""}
            onChange={(e) => setFilter("invoiceStatus", e.target.value)}
          >
            <option value="">Trạng thái</option>
            <option value="unpaid">Chưa TT</option>
            <option value="partial">Một phần</option>
            <option value="paid">Đã TT</option>
            <option value="cancelled">Đã hủy</option>
          </Select>
          <Input
            className="w-44"
            placeholder="Mã hóa đơn..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </>
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
          <Button variant="outline" size="sm" onClick={() => toggleSort("dueDate")}>
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
