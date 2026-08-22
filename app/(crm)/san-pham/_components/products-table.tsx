"use client";

import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { Pagination } from "@/components/datagrid/pagination";
import { RowActions } from "@/components/datagrid/row-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusDot } from "@/components/ui/status-dot";
import { useProducts } from "@/features/products/hooks/use-products";
import type { Product } from "@/features/products/types";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatVnd } from "@/features/shared/utils/money";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { Package } from "lucide-react";
import { useMemo } from "react";

const STATUS_MAP = {
  active: { label: "Đang bán", color: "green" },
  inactive: { label: "Ngưng", color: "gray" },
} as const;

export function ProductsTable() {
  const list = useListPage();
  const { canEdit, canDelete } = useCurrentUser();
  const { rows, loading, getStock, removeMany } = useProducts({
    query: list.query,
    category: list.filters.category,
    status: list.filters.status,
  });

  const sorted = useMemo(() => {
    if (!list.sortKey) return rows;
    const dir = list.sortDir === "asc" ? 1 : -1;
    const key = list.sortKey === "price" ? "unitPrice" : list.sortKey;
    return [...rows].sort((a, b) => {
      const av = String((a as Record<string, unknown>)[key] ?? "");
      const bv = String((b as Record<string, unknown>)[key] ?? "");
      return av.localeCompare(bv, "vi") * dir;
    });
  }, [rows, list.sortKey, list.sortDir]);

  const pageRows = list.paginate(sorted);

  const allColumns: DataGridColumn<Product>[] = [
    {
      id: "sku",
      header: "SKU",
      width: "w-28",
      sortable: true,
      cell: (r) => <span className="font-mono text-xs">{r.sku}</span>,
    },
    {
      id: "name",
      header: "Tên",
      sortable: true,
      cell: (r) => <span className="font-medium">{r.name}</span>,
    },
    {
      id: "category",
      header: "Danh mục",
      sortable: true,
      cell: (r) => <span className="text-muted">{r.category}</span>,
    },
    {
      id: "unit",
      header: "Đơn vị",
      cell: (r) => r.unit,
    },
    {
      id: "price",
      header: "Đơn giá",
      sortable: true,
      cell: (r) => <span className="font-medium">{formatVnd(r.unitPrice)}</span>,
    },
    {
      id: "vat",
      header: "VAT",
      cell: (r) => `${r.vatPercent}%`,
    },
    {
      id: "stock",
      header: "Tồn kho",
      cell: (r) => {
        const qty = getStock(r.id);
        const low = qty <= r.minStock;
        return (
          <span className={low ? "font-medium text-danger" : undefined}>{qty}</span>
        );
      },
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (r) => {
        const meta = STATUS_MAP[r.status];
        return <StatusDot color={meta.color} label={meta.label} />;
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      sticky: "right",
      cell: (r) => (
        <RowActions
          onView={() => list.setViewId(r.id)}
          onEdit={canEdit("products") ? () => list.setEditId(r.id) : undefined}
          onDelete={canDelete("products") ? () => list.setDeleteId(r.id) : undefined}
        />
      ),
    },
  ];

  const columns = allColumns.filter((c) => list.visibleColumns.includes(c.id));

  return (
    <>
      {list.selectedIds.length > 0 ? (
        <div className="flex h-9 items-center gap-2 border-b border-border bg-amber-50 px-3 text-xs">
          <span>Đã chọn {list.selectedIds.length}</span>
          <button
            type="button"
            className="font-medium text-danger underline"
            onClick={() => {
              removeMany(list.selectedIds);
              list.clearSelection();
            }}
          >
            Xóa đã chọn
          </button>
        </div>
      ) : null}
      <DataGrid
        columns={columns}
        rows={pageRows}
        selectedIds={list.selectedIds}
        onToggleSelect={list.toggleSelect}
        onToggleSelectAll={() => list.toggleSelectAll(pageRows.map((r) => r.id))}
        onRowClick={(r) => list.setViewId(r.id)}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.toggleSort}
        loading={loading}
        empty={
          <EmptyState
            icon={Package}
            title="Không có sản phẩm"
            description="Thử đổi bộ lọc hoặc tạo sản phẩm mới."
          />
        }
      />
      <Pagination
        page={list.page}
        pageSize={list.pageSize}
        total={sorted.length}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
      />
    </>
  );
}
