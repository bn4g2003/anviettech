"use client";

import { FilterBar } from "@/components/datagrid/filter-bar";
import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/datagrid/search-input";
import { MultiSelectFilter } from "@/components/datagrid/multi-select-filter";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useProducts } from "@/features/products/hooks/use-products";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import { Filter, RefreshCw, ArrowUpDown } from "lucide-react";

const COLUMN_DEFS = [
  { id: "sku", label: "SKU" },
  { id: "name", label: "Sản phẩm" },
  { id: "category", label: "Danh mục" },
  { id: "warehouse", label: "Kho" },
  { id: "unit", label: "ĐVT" },
  { id: "qty", label: "Tồn kho" },
  { id: "minStock", label: "Tối thiểu" },
  { id: "costPrice", label: "Giá vốn" },
  { id: "totalValue", label: "Tổng giá trị" },
  { id: "status", label: "Cảnh báo" },
  { id: "actions", label: "Thao tác" },
];

export function StockLevelsFilterBar() {
  const {
    query,
    setQuery,
    filters,
    setFilter,
    visibleColumns,
    setVisibleColumns,
    toggleSort,
  } = useListPage();
  const { categories } = useProducts();
  const { warehouses } = useInventory();

  return (
    <FilterBar
      filters={
        <>
          <SearchInput
            className="w-60"
            placeholder="Tìm tên sản phẩm, SKU..."
            value={query}
            onChange={setQuery}
          />
          <MultiSelectFilter
            title="Kho"
            value={filters.warehouseId ?? ""}
            onChange={(val) => setFilter("warehouseId", val)}
            options={warehouses.map((w) => ({
              value: w.id,
              label: `${w.code} — ${w.name}`,
            }))}
          />
          <MultiSelectFilter
            title="Danh mục"
            value={filters.category ?? ""}
            onChange={(val) => setFilter("category", val)}
            options={categories.map((c) => ({ value: c, label: c }))}
          />
          <MultiSelectFilter
            title="Cảnh báo tồn"
            value={filters.stockStatus ?? ""}
            onChange={(val) => setFilter("stockStatus", val)}
            options={[
              { value: "low", label: "Sắp hết" },
              { value: "ok", label: "Đủ tồn" },
            ]}
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
          <Button variant="outline" size="sm" onClick={() => toggleSort("qty")}>
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
