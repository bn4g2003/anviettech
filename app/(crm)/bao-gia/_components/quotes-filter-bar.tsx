"use client";

import { DateRangeFilter } from "@/components/datagrid/date-range-filter";
import { FilterBar } from "@/components/datagrid/filter-bar";
import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/datagrid/search-input";
import { MultiSelectFilter } from "@/components/datagrid/multi-select-filter";
import { CustomerLookup } from "@/components/lookups/customer-lookup";
import { OwnerLookup } from "@/components/lookups/owner-lookup";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { Filter, RefreshCw, ArrowUpDown } from "lucide-react";

const COLUMN_DEFS = [
  { id: "code", label: "Mã" },
  { id: "customer", label: "Khách hàng" },
  { id: "deal", label: "Cơ hội" },
  { id: "status", label: "Trạng thái" },
  { id: "total", label: "Tổng tiền" },
  { id: "validUntil", label: "Hiệu lực đến" },
  { id: "owner", label: "Phụ trách" },
  { id: "actions", label: "Thao tác" },
];

export function QuotesFilterBar() {
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
          <SearchInput
            className="w-60"
            placeholder="Tìm mã báo giá, khách hàng..."
            value={query}
            onChange={setQuery}
          />
          <MultiSelectFilter
            title="Trạng thái"
            value={filters.status ?? ""}
            onChange={(val) => setFilter("status", val)}
            options={[
              { value: "draft", label: "Nháp" },
              { value: "sent", label: "Đã gửi" },
              { value: "approved", label: "Đã duyệt" },
              { value: "rejected", label: "Từ chối" },
              { value: "expired", label: "Hết hạn" },
            ]}
          />
          <CustomerLookup
            multiple
            value={filters.customerId}
            onChange={(v) => setFilter("customerId", v)}
            emptyLabel="Khách hàng"
          />
          <OwnerLookup
            multiple
            value={filters.ownerId}
            onChange={(v) => setFilter("ownerId", v)}
          />
          <DateRangeFilter
            fromDate={filters.fromDate}
            toDate={filters.toDate}
            onChange={(from, to) => {
              setFilter("fromDate", from);
              setFilter("toDate", to);
            }}
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
