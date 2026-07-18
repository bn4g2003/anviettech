"use client";

import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { Pagination } from "@/components/datagrid/pagination";
import { RowActions } from "@/components/datagrid/row-actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import type { StockMove, StockMoveType } from "@/features/inventory/types";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useToast } from "@/components/ui/toast";
import { CheckCircle2, Package } from "lucide-react";
import { useMemo } from "react";
import { StockMoveStatusBadge } from "./stock-move-status";

type Props = {
  moveType: StockMoveType;
};

function warehouseLabel(r: StockMove) {
  if (r.type === "in") return r.warehouseTo ?? "—";
  if (r.type === "out") return r.warehouseFrom ?? "—";
  return `${r.warehouseFrom ?? "—"} → ${r.warehouseTo ?? "—"}`;
}

function linesSummary(r: StockMove) {
  if (r.lines.length === 0) return "—";
  const first = r.lines[0];
  if (r.lines.length === 1) return `${first.productName} ×${first.qty}`;
  return `${first.productName} ×${first.qty} +${r.lines.length - 1}`;
}

export function StockMovesTable({ moveType }: Props) {
  const list = useListPage();
  const { moves, postMove } = useInventory();
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const q = list.query.trim().toLowerCase();
    return moves.filter((m) => {
      if (m.type !== moveType) return false;
      if (list.filters.status && m.status !== list.filters.status) return false;
      if (list.filters.ownerId && m.owner.id !== list.filters.ownerId) return false;
      if (!q) return true;
      return (
        m.code.toLowerCase().includes(q) ||
        m.lines.some((l) => l.productName.toLowerCase().includes(q))
      );
    });
  }, [moves, moveType, list.query, list.filters.status, list.filters.ownerId]);

  const sorted = useMemo(() => {
    if (!list.sortKey) return filtered;
    const dir = list.sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = String((a as Record<string, unknown>)[list.sortKey] ?? "");
      const bv = String((b as Record<string, unknown>)[list.sortKey] ?? "");
      return av.localeCompare(bv, "vi") * dir;
    });
  }, [filtered, list.sortKey, list.sortDir]);

  const pageRows = list.paginate(sorted);

  const allColumns: DataGridColumn<StockMove>[] = [
    {
      id: "code",
      header: "Mã",
      width: "w-28",
      sortable: true,
      cell: (r) => <span className="font-mono text-xs">{r.code}</span>,
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (r) => <StockMoveStatusBadge status={r.status} />,
    },
    {
      id: "warehouse",
      header: "Kho",
      cell: (r) => <span className="text-muted">{warehouseLabel(r)}</span>,
    },
    {
      id: "orderId",
      header: "Đơn hàng",
      cell: (r) => (
        <span className="font-mono text-xs text-muted">{r.orderId ?? "—"}</span>
      ),
    },
    {
      id: "lines",
      header: "Dòng hàng",
      cell: (r) => <span className="text-muted">{linesSummary(r)}</span>,
    },
    {
      id: "owner",
      header: "Phụ trách",
      cell: (r) => r.owner.name,
    },
    {
      id: "actions",
      header: "Thao tác",
      sticky: "right",
      cell: (r) => (
        <RowActions
          onView={() => list.setViewId(r.id)}
          onDelete={r.status === "draft" ? () => list.setDeleteId(r.id) : undefined}
          extra={
            r.status === "draft" ? (
              <Button
                variant="ghost"
                size="icon"
                title="Ghi sổ"
                onClick={(e) => {
                  e.stopPropagation();
                  postMove(r.id);
                  toast("Đã ghi sổ phiếu kho", "success");
                }}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              </Button>
            ) : null
          }
        />
      ),
    },
  ];

  const columns = allColumns.filter((c) => list.visibleColumns.includes(c.id));

  return (
    <>
      <DataGrid
        columns={columns}
        rows={pageRows}
        onRowClick={(r) => list.setViewId(r.id)}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.toggleSort}
        empty={
          <EmptyState
            icon={Package}
            title="Không có phiếu kho"
            description="Thử đổi bộ lọc hoặc tạo phiếu mới."
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
