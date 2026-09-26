"use client";

import { DateRangeFilter } from "@/components/datagrid/date-range-filter";
import { FilterBar } from "@/components/datagrid/filter-bar";
import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/datagrid/search-input";
import { MultiSelectFilter } from "@/components/datagrid/multi-select-filter";
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
          <SearchInput
            className="w-60"
            placeholder="Tìm tiêu đề công việc..."
            value={query}
            onChange={setQuery}
          />
          <MultiSelectFilter
            title="Trạng thái"
            value={filters.status ?? ""}
            onChange={(val) => setFilter("status", val)}
            options={[
              { value: "open", label: "Mở" },
              { value: "done", label: "Xong" },
              { value: "cancelled", label: "Đã hủy" },
            ]}
          />
          <MultiSelectFilter
            title="Loại"
            value={filters.type ?? ""}
            onChange={(val) => setFilter("type", val)}
            options={Object.entries(TASK_TYPE_LABEL).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <OwnerLookup
            multiple
            value={filters.ownerId}
            onChange={(v) => setFilter("ownerId", v)}
          />
          <MultiSelectFilter
            title="Góc nhìn"
            value={filters.view ?? ""}
            onChange={(val) => setFilter("view", val)}
            options={[
              { value: "my", label: "Việc của tôi" },
              { value: "today", label: "Hôm nay" },
              { value: "overdue", label: "Quá hạn" },
              { value: "upcoming", label: "Sắp tới" },
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
