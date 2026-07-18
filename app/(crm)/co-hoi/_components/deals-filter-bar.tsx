"use client";

import { FilterBar } from "@/components/datagrid/filter-bar";
import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CustomerLookup } from "@/components/lookups/customer-lookup";
import { OwnerLookup } from "@/components/lookups/owner-lookup";
import { DEAL_STAGE_META, type DealStage } from "@/features/deals/types";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { ArrowUpDown, Filter, RefreshCw } from "lucide-react";

const COLUMN_DEFS = [
  { id: "code", label: "Mã" },
  { id: "title", label: "Tiêu đề" },
  { id: "customer", label: "Khách hàng" },
  { id: "stage", label: "Giai đoạn" },
  { id: "value", label: "Giá trị" },
  { id: "probability", label: "Xác suất" },
  { id: "owner", label: "Phụ trách" },
  { id: "expectedCloseDate", label: "Dự kiến chốt" },
  { id: "updatedAt", label: "Cập nhật" },
  { id: "actions", label: "Thao tác" },
];

const STAGES = Object.keys(DEAL_STAGE_META) as DealStage[];

export function DealsFilterBar() {
  const {
    query,
    setQuery,
    filters,
    setFilter,
    visibleColumns,
    setVisibleColumns,
    toggleSort,
  } = useListPage();

  const isKanban = filters.viewMode === "kanban";

  return (
    <FilterBar
      filters={
        <>
          <Select
            value={filters.stage ?? ""}
            onChange={(e) => setFilter("stage", e.target.value)}
          >
            <option value="">Giai đoạn</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {DEAL_STAGE_META[s].label}
              </option>
            ))}
          </Select>
          <OwnerLookup
            value={filters.ownerId}
            onChange={(v) => setFilter("ownerId", v)}
          />
          <CustomerLookup
            value={filters.customerId}
            onChange={(v) => setFilter("customerId", v)}
            emptyLabel="Khách hàng"
          />
          <Input
            className="w-44"
            placeholder="Tiêu đề / mã..."
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
          {!isKanban ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSort("title")}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                Sắp xếp
              </Button>
              <ColumnToggle
                columns={COLUMN_DEFS}
                visibleIds={visibleColumns}
                onChange={setVisibleColumns}
              />
            </>
          ) : null}
        </>
      }
    />
  );
}
