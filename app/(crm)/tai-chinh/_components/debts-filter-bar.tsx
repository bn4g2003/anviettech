"use client";

import { FilterBar } from "@/components/datagrid/filter-bar";
import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { RefreshCw } from "lucide-react";

const COLUMN_DEFS = [
  { id: "code", label: "Mã KH" },
  { id: "customer", label: "Khách hàng" },
  { id: "phone", label: "Số điện thoại" },
  { id: "owner", label: "Phụ trách" },
  { id: "invoiceCount", label: "Số HĐ nợ" },
  { id: "debt", label: "Công nợ" },
  { id: "status", label: "Tình trạng" },
  { id: "actions", label: "Thao tác" },
];

export function DebtsFilterBar({ onRefresh }: { onRefresh?: () => void }) {
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
          <Select
            className="w-36 max-w-[150px] truncate text-xs"
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
          <Input
            className="w-48 text-xs"
            placeholder="Tên khách hàng, SĐT..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </>
      }
      actions={
        <>
          <Select
            className="w-36 text-xs"
            value={sortKey ? `${sortKey}_${sortDir}` : "debt_desc"}
            onChange={(e) => {
              const [key, dir] = e.target.value.split("_");
              setSort(key, dir as "asc" | "desc");
            }}
          >
            <option value="debt_desc">Nợ nhiều nhất</option>
            <option value="debt_asc">Nợ ít nhất</option>
            <option value="invoiceCount_desc">Nhiều HĐ nợ nhất</option>
            <option value="customer_asc">Khách hàng A → Z</option>
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
