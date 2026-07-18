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
  { id: "invoice", label: "Hóa đơn" },
  { id: "customer", label: "Khách hàng" },
  { id: "amount", label: "Số tiền" },
  { id: "method", label: "Phương thức" },
  { id: "paidAt", label: "Ngày TT" },
  { id: "owner", label: "Phụ trách" },
];

export function PaymentsFilterBar() {
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
            value={filters.method ?? ""}
            onChange={(e) => setFilter("method", e.target.value)}
          >
            <option value="">Phương thức</option>
            <option value="bank">Chuyển khoản</option>
            <option value="cash">Tiền mặt</option>
            <option value="card">Thẻ</option>
            <option value="other">Khác</option>
          </Select>
          <Input
            className="w-44"
            placeholder="Mã TT..."
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
          <Button variant="outline" size="sm" onClick={() => toggleSort("paidAt")}>
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
