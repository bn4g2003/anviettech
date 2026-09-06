"use client";

import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { Pagination } from "@/components/datagrid/pagination";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { Boxes } from "lucide-react";
import { useMemo } from "react";

import { useRouter } from "next/navigation";
import { formatVnd } from "@/features/shared/utils/money";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

type StockRow = {
  id: string;
  productId: string;
  qty: number;
  product?: {
    sku: string;
    name: string;
    minStock: number;
    category: string;
    unit?: string;
    costPrice?: number;
  };
};

export function StockLevelsTable() {
  const router = useRouter();
  const list = useListPage();
  const { levels, loading } = useInventory();

  const filtered = useMemo(() => {
    const q = list.query.trim().toLowerCase();
    return (levels as unknown as StockRow[]).filter((row) => {
      const p = row.product;
      if (!p) return false;
      if (list.filters.category && p.category !== list.filters.category) return false;
      const isLow = p.minStock > 0 && row.qty < p.minStock;
      if (list.filters.stockStatus === "low" && !isLow) return false;
      if (list.filters.stockStatus === "ok" && isLow) return false;
      if (!q) return true;
      return (
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [levels, list.query, list.filters.category, list.filters.stockStatus]);

  const sorted = useMemo(() => {
    if (!list.sortKey) return filtered;
    const dir = list.sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (list.sortKey === "qty") return (a.qty - b.qty) * dir;
      if (list.sortKey === "totalValue") {
        const valA = (a.product?.costPrice ?? 0) * a.qty;
        const valB = (b.product?.costPrice ?? 0) * b.qty;
        return (valA - valB) * dir;
      }
      if (list.sortKey === "sku") {
        return (a.product?.sku ?? "").localeCompare(b.product?.sku ?? "", "vi") * dir;
      }
      if (list.sortKey === "name") {
        return (a.product?.name ?? "").localeCompare(b.product?.name ?? "", "vi") * dir;
      }
      return 0;
    });
  }, [filtered, list.sortKey, list.sortDir]);

  const pageRows = list.paginate(sorted) as StockRow[];

  const allColumns: DataGridColumn<StockRow>[] = [
    {
      id: "sku",
      header: "SKU",
      width: "w-28",
      sortable: true,
      cell: (r) => <span className="font-mono text-xs font-semibold text-foreground/90">{r.product?.sku}</span>,
    },
    {
      id: "name",
      header: "Sản phẩm",
      sortable: true,
      cell: (r) => <span className="font-medium text-foreground">{r.product?.name}</span>,
    },
    {
      id: "category",
      header: "Danh mục",
      cell: (r) => <span className="text-muted">{r.product?.category || "—"}</span>,
    },
    {
      id: "unit",
      header: "ĐVT",
      width: "w-20",
      cell: (r) => <span className="text-muted">{r.product?.unit || "—"}</span>,
    },
    {
      id: "qty",
      header: "Tồn kho",
      width: "w-24",
      sortable: true,
      cell: (r) => <span className="font-bold text-foreground">{r.qty}</span>,
    },
    {
      id: "minStock",
      header: "Tối thiểu",
      width: "w-24",
      cell: (r) => <span className="text-muted">{r.product?.minStock ?? 0}</span>,
    },
    {
      id: "costPrice",
      header: "Giá vốn",
      width: "w-32",
      cell: (r) => (
        <span className="text-muted whitespace-nowrap">
          {formatVnd(r.product?.costPrice ?? 0)}
        </span>
      ),
    },
    {
      id: "totalValue",
      header: "Tổng giá trị",
      width: "w-36",
      sortable: true,
      cell: (r) => (
        <span className="font-semibold text-primary whitespace-nowrap">
          {formatVnd((r.product?.costPrice ?? 0) * r.qty)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Cảnh báo",
      width: "w-28",
      cell: (r) => {
        const min = r.product?.minStock ?? 0;
        const isLow = min > 0 && r.qty < min;
        return isLow ? (
          <Badge tone="danger">Sắp hết</Badge>
        ) : (
          <Badge tone="success">Đủ tồn</Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      sticky: "right",
      width: "w-24",
      cell: (r) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted hover:text-foreground"
            title="Xem chi tiết sản phẩm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/san-pham?search=${r.product?.sku || ""}`);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const columns = allColumns.filter((c) => list.visibleColumns.includes(c.id));

  return (
    <>
      <DataGrid
        columns={columns}
        rows={pageRows}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.toggleSort}
        loading={loading}
        empty={
          <EmptyState
            icon={Boxes}
            title="Không có tồn kho"
            description="Thử đổi bộ lọc hoặc nhập kho."
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
