"use client";

import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { FilterBar } from "@/components/datagrid/filter-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
          <Select
            value={filters.status ?? ""}
            onChange={(e) => setFilter("status", e.target.value)}
          >
            <option value="">Trạng thái</option>
            {Object.entries(CAMPAIGN_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            value={filters.channel ?? ""}
            onChange={(e) => setFilter("channel", e.target.value)}
          >
            <option value="">Kênh</option>
            {Object.entries(CAMPAIGN_CHANNEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            className="w-48"
            placeholder="Tên / mã chiến dịch..."
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
