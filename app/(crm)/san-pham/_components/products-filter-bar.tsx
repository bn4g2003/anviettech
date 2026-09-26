"use client";

import { FilterBar } from "@/components/datagrid/filter-bar";
import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/datagrid/search-input";
import { MultiSelectFilter } from "@/components/datagrid/multi-select-filter";
import { useProducts } from "@/features/products/hooks/use-products";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { Filter, RefreshCw, ArrowUpDown } from "lucide-react";

const COLUMN_DEFS = [
  { id: "sku", label: "SKU" },
  { id: "name", label: "Tên" },
  { id: "category", label: "Danh mục" },
  { id: "itemType", label: "Loại" },
  { id: "unit", label: "Đơn vị" },
  { id: "price", label: "Đơn giá" },
  { id: "vat", label: "VAT" },
  { id: "stock", label: "Tồn kho" },
  { id: "status", label: "Trạng thái" },
  { id: "actions", label: "Thao tác" },
];

export function ProductsFilterBar() {
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
            title="Danh mục"
            value={filters.category ?? ""}
            onChange={(val) => setFilter("category", val)}
            options={categories.map((c) => ({ value: c, label: c }))}
          />
          <MultiSelectFilter
            title="Trạng thái"
            value={filters.status ?? ""}
            onChange={(val) => setFilter("status", val)}
            options={[
              { value: "active", label: "Đang bán" },
              { value: "inactive", label: "Ngưng" },
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
