"use client";

import { DateRangeFilter } from "@/components/datagrid/date-range-filter";
import { FilterBar } from "@/components/datagrid/filter-bar";
import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/datagrid/search-input";
import { Select } from "@/components/ui/select";
import { OwnerLookup } from "@/components/lookups/owner-lookup";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { apiFetch, toQuery } from "@/lib/api-client";
import { Filter, RefreshCw, ArrowUpDown } from "lucide-react";
import { useEffect, useState } from "react";

type Reference = { id: string; code: string; name: string };

const COLUMN_DEFS = [
  { id: "code", label: "Mã" },
  { id: "status", label: "Trạng thái" },
  { id: "reason", label: "Nghiệp vụ" },
  { id: "warehouse", label: "Kho" },
  { id: "orderId", label: "Đơn hàng" },
  { id: "lines", label: "Dòng hàng" },
  { id: "owner", label: "Phụ trách" },
  { id: "actions", label: "Thao tác" },
];

export function StockMovesFilterBar() {
  const {
    query,
    setQuery,
    filters,
    setFilter,
    visibleColumns,
    setVisibleColumns,
    toggleSort,
  } = useListPage();
  const [references, setReferences] = useState<{ suppliers: Reference[]; customers: Reference[]; projects: Reference[] }>({ suppliers: [], customers: [], projects: [] });

  useEffect(() => {
    void Promise.all([
      apiFetch<Reference[]>(`/api/v1/suppliers${toQuery({ pageSize: 100, status: "active" })}`),
      apiFetch<Reference[]>(`/api/v1/customers${toQuery({ pageSize: 100, status: "active" })}`),
      apiFetch<Reference[]>(`/api/v1/projects${toQuery({ pageSize: 100 })}`),
    ]).then(([suppliers, customers, projects]) => setReferences({
      suppliers: suppliers.data ?? [], customers: customers.data ?? [], projects: projects.data ?? [],
    })).catch(() => setReferences({ suppliers: [], customers: [], projects: [] }));
  }, []);

  return (
    <FilterBar
      filters={
        <>
          <SearchInput
            className="w-64"
            placeholder="Tìm mã phiếu, hàng hóa, đối tác, kho..."
            value={query}
            onChange={setQuery}
          />
          <Select
            value={filters.status ?? ""}
            onChange={(e) => setFilter("status", e.target.value)}
          >
            <option value="">Trạng thái</option>
            <option value="draft">Nháp</option>
            <option value="posted">Đã ghi sổ</option>
            <option value="cancelled">Đã hủy</option>
          </Select>
          <OwnerLookup
            value={filters.ownerId}
            onChange={(v) => setFilter("ownerId", v)}
          />
          <ReferenceFilter label="Nhà cung cấp" value={filters.supplierId ?? ""} rows={references.suppliers} onChange={(value) => setFilter("supplierId", value)} />
          <ReferenceFilter label="Khách hàng" value={filters.customerId ?? ""} rows={references.customers} onChange={(value) => setFilter("customerId", value)} />
          <ReferenceFilter label="Công trình" value={filters.projectId ?? ""} rows={references.projects} onChange={(value) => setFilter("projectId", value)} />
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

function ReferenceFilter({ label, value, rows, onChange }: { label: string; value: string; rows: Reference[]; onChange: (value: string) => void }) {
  return <Select value={value} onChange={(event) => onChange(event.target.value)}><option value="">{label}</option>{rows.map((row) => <option key={row.id} value={row.id}>{row.code} — {row.name}</option>)}</Select>;
}
