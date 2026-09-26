"use client";

import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { DateRangeFilter } from "@/components/datagrid/date-range-filter";
import { FilterBar } from "@/components/datagrid/filter-bar";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/datagrid/search-input";
import { MultiSelectFilter } from "@/components/datagrid/multi-select-filter";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { ArrowUpDown, Filter, RefreshCw } from "lucide-react";
import {
  CAMPAIGN_CHANNEL_LABELS,
  CAMPAIGN_STATUS_LABELS,
} from "./campaign-status";

const COLUMN_DEFS = [
  { id: "code", label: "Mã" },
  { id: "name", label: "Tên chiến dịch" },
  { id: "channel", label: "Kênh" },
  { id: "status", label: "Trạng thái" },
  { id: "budget", label: "Ngân sách" },
  { id: "spent", label: "Đã chi" },
  { id: "leadsCount", label: "Leads" },
  { id: "owner", label: "Phụ trách" },
  { id: "startDate", label: "Bắt đầu" },
  { id: "endDate", label: "Kết thúc" },
  { id: "actions", label: "Thao tác" },
];

export function MarketingFilterBar() {
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
            placeholder="Tìm tên, mã chiến dịch..."
            value={query}
            onChange={setQuery}
          />
          <MultiSelectFilter
            title="Trạng thái"
            value={filters.status ?? ""}
            onChange={(val) => setFilter("status", val)}
            options={Object.entries(CAMPAIGN_STATUS_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <MultiSelectFilter
            title="Kênh"
            value={filters.channel ?? ""}
            onChange={(val) => setFilter("channel", val)}
            options={Object.entries(CAMPAIGN_CHANNEL_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
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
