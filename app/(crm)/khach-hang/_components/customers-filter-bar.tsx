"use client";

import { FilterBar } from "@/components/datagrid/filter-bar";
import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { OwnerLookup } from "@/components/lookups/owner-lookup";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { Filter, RefreshCw, ArrowUpDown } from "lucide-react";

const COLUMN_DEFS = [
  { id: "code", label: "Mã" },
  { id: "name", label: "Tổ chức" },
  { id: "status", label: "Trạng thái" },
  { id: "email", label: "Email" },
  { id: "phone", label: "SĐT" },
  { id: "owner", label: "Phụ trách" },
  { id: "updatedAt", label: "Cập nhật" },
  { id: "debt", label: "Công nợ" },
  { id: "actions", label: "Thao tác" },
];

export function CustomersFilterBar() {
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
            value={filters.type ?? ""}
            onChange={(e) => setFilter("type", e.target.value)}
          >
            <option value="">Loại</option>
            <option value="company">Doanh nghiệp</option>
            <option value="individual">Cá nhân</option>
          </Select>
          <Select
            value={filters.status ?? ""}
            onChange={(e) => setFilter("status", e.target.value)}
          >
            <option value="">Trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="lead">Lead</option>
            <option value="inactive">Ngưng</option>
          </Select>
          <OwnerLookup
            value={filters.ownerId}
            onChange={(v) => setFilter("ownerId", v)}
          />
          <Input
            className="w-44"
            placeholder="Tên / mã / SĐT..."
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
          <Button variant="outline" size="sm" onClick={() => toggleSort("name")}>
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
