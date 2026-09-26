"use client";

import { DateRangeFilter } from "@/components/datagrid/date-range-filter";
import { FilterBar } from "@/components/datagrid/filter-bar";
import { SearchInput } from "@/components/datagrid/search-input";
import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { MultiSelectFilter } from "@/components/datagrid/multi-select-filter";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { RefreshCw } from "lucide-react";

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

export function InvoicesFilterBar({ onRefresh }: { onRefresh?: () => void }) {
  const {
    query,
    setQuery,
    filters,
    setFilter,
    visibleColumns,
    setVisibleColumns,
    sortKey,
    sortDir,
    setSort,
  } = useListPage();
  const { all: customers } = useCustomers();

  return (
    <FilterBar
      filters={
        <>
          <SearchInput
            className="w-60"
            placeholder="Tìm mã HĐ, tên KH, SĐT..."
            value={query}
            onChange={setQuery}
          />
          <MultiSelectFilter
            title="Khách hàng"
            value={filters.customerId ?? ""}
            onChange={(val) => setFilter("customerId", val)}
            options={customers.map((c) => ({
              value: c.id,
              label: `${c.code} — ${c.name}`,
            }))}
          />
          <MultiSelectFilter
            title="Trạng thái"
            value={filters.invoiceStatus ?? ""}
            onChange={(val) => setFilter("invoiceStatus", val)}
            options={[
              { value: "unpaid", label: "Chưa TT" },
              { value: "partial", label: "Một phần" },
              { value: "paid", label: "Đã TT" },
              { value: "cancelled", label: "Đã hủy" },
            ]}
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
          <Select
            className="w-36 text-xs"
            value={sortKey ? `${sortKey}_${sortDir}` : "dueDate_desc"}
            onChange={(e) => {
              const [key, dir] = e.target.value.split("_");
              setSort(key, dir as "asc" | "desc");
            }}
          >
            <option value="dueDate_desc">Hạn TT: Mới nhất</option>
            <option value="amount_desc">Số tiền: Cao → Thấp</option>
            <option value="amount_asc">Số tiền: Thấp → Cao</option>
            <option value="remaining_desc">Còn nợ: Cao → Thấp</option>
            <option value="paidAmount_desc">Đã TT: Cao → Thấp</option>
            <option value="customer_asc">Khách hàng: A → Z</option>
          </Select>
          <Button
            variant="outline"
            size="icon"
            title="Làm mới"
            onClick={() => onRefresh?.()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
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
