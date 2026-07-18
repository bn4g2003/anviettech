"use client";

import { FilterBar } from "@/components/datagrid/filter-bar";
import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CustomerLookup } from "@/components/lookups/customer-lookup";
import { OwnerLookup } from "@/components/lookups/owner-lookup";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { Filter, RefreshCw, ArrowUpDown } from "lucide-react";

const COLUMN_DEFS = [
  { id: "code", label: "Mã" },
  { id: "customer", label: "Khách hàng" },
  { id: "quoteId", label: "Báo giá" },
  { id: "status", label: "Trạng thái" },
  { id: "value", label: "Giá trị" },
  { id: "startDate", label: "Bắt đầu" },
  { id: "endDate", label: "Kết thúc" },
  { id: "owner", label: "Phụ trách" },
  { id: "actions", label: "Thao tác" },
];

export function ContractsFilterBar() {
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
            value={filters.status ?? ""}
            onChange={(e) => setFilter("status", e.target.value)}
          >
            <option value="">Trạng thái</option>
            <option value="draft">Nháp</option>
            <option value="active">Hiệu lực</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </Select>
          <CustomerLookup
            value={filters.customerId}
            onChange={(v) => setFilter("customerId", v)}
            emptyLabel="Khách hàng"
          />
          <OwnerLookup
            value={filters.ownerId}
            onChange={(v) => setFilter("ownerId", v)}
          />
          <Input
            className="w-40"
            placeholder="Mã hợp đồng..."
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
          <Button variant="outline" size="sm" onClick={() => toggleSort("code")}>
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
