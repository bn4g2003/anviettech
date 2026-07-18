"use client";

import { FilterBar } from "@/components/datagrid/filter-bar";
import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useProducts } from "@/features/products/hooks/use-products";
import { Filter, RefreshCw, ArrowUpDown } from "lucide-react";

const COLUMN_DEFS = [
  { id: "sku", label: "SKU" },
  { id: "name", label: "Sản phẩm" },
  { id: "qty", label: "Tồn" },
  { id: "minStock", label: "Tối thiểu" },
  { id: "status", label: "Cảnh báo" },
  { id: "category", label: "Danh mục" },
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

  return (
    <FilterBar
      filters={
        <>
          <Select
            value={filters.category ?? ""}
            onChange={(e) => setFilter("category", e.target.value)}
          >
            <option value="">Danh mục</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            value={filters.stockStatus ?? ""}
            onChange={(e) => setFilter("stockStatus", e.target.value)}
          >
            <option value="">Tồn kho</option>
            <option value="low">Sắp hết</option>
            <option value="ok">Đủ tồn</option>
          </Select>
          <Input
            className="w-44"
            placeholder="SKU / tên..."
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
