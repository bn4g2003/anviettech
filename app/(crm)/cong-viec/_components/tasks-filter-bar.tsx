"use client";

import { FilterBar } from "@/components/datagrid/filter-bar";
import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { OwnerLookup } from "@/components/lookups/owner-lookup";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { TASK_TYPE_LABEL } from "@/features/tasks/types";
import { Filter, RefreshCw, ArrowUpDown } from "lucide-react";

const COLUMN_DEFS = [
  { id: "title", label: "Tiêu đề" },
  { id: "type", label: "Loại" },
  { id: "status", label: "Trạng thái" },
  { id: "dueAt", label: "Hạn" },
  { id: "owner", label: "Phụ trách" },
  { id: "customer", label: "Khách hàng" },
  { id: "deal", label: "Cơ hội" },
  { id: "actions", label: "Thao tác" },
];

export function TasksFilterBar() {
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
            <option value="open">Mở</option>
            <option value="done">Xong</option>
            <option value="cancelled">Đã hủy</option>
          </Select>
          <Select
            value={filters.type ?? ""}
            onChange={(e) => setFilter("type", e.target.value)}
          >
            <option value="">Loại</option>
            {Object.entries(TASK_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <OwnerLookup
            value={filters.ownerId}
            onChange={(v) => setFilter("ownerId", v)}
          />
          <Select
            value={filters.view ?? ""}
            onChange={(e) => setFilter("view", e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="my">Việc của tôi</option>
            <option value="today">Hôm nay</option>
            <option value="overdue">Quá hạn</option>
            <option value="upcoming">Sắp tới</option>
          </Select>
          <Input
            className="w-44"
            placeholder="Tìm tiêu đề..."
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
          <Button variant="outline" size="sm" onClick={() => toggleSort("dueAt")}>
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
