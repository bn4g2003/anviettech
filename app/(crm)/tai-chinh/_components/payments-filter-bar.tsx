"use client";

import { FilterBar } from "@/components/datagrid/filter-bar";
import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/datagrid/search-input";
import { Select } from "@/components/ui/select";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { RefreshCw } from "lucide-react";

const COLUMN_DEFS = [
  { id: "code", label: "Mã" },
  { id: "invoice", label: "Hóa đơn" },
  { id: "customer", label: "Khách hàng" },
  { id: "amount", label: "Số tiền" },
  { id: "method", label: "Phương thức" },
  { id: "paidAt", label: "Ngày TT" },
  { id: "owner", label: "Phụ trách" },
];

export function PaymentsFilterBar({ onRefresh }: { onRefresh?: () => void }) {
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
            placeholder="Tìm mã TT, mã HĐ, tên KH..."
            value={query}
            onChange={setQuery}
          />
          <Select
            value={filters.customerId ?? ""}
            onChange={(e) => setFilter("customerId", e.target.value)}
          >
            <option value="">Khách hàng</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </Select>
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
        </>
      }
      actions={
        <>
          <Select
            className="w-36 text-xs"
            value={sortKey ? `${sortKey}_${sortDir}` : "paidAt_desc"}
            onChange={(e) => {
              const [key, dir] = e.target.value.split("_");
              setSort(key, dir as "asc" | "desc");
            }}
          >
            <option value="paidAt_desc">Ngày TT: Mới nhất</option>
            <option value="paidAt_asc">Ngày TT: Cũ nhất</option>
            <option value="amount_desc">Số tiền: Cao → Thấp</option>
            <option value="amount_asc">Số tiền: Thấp → Cao</option>
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
