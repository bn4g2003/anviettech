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

const REASON_LABEL: Record<StockMove["reason"], string> = {
  purchase_receipt: "Nhập hàng mới", customer_return: "Khách trả lại", warranty_receipt: "Bảo hành nhập về",
  installation_issue: "Xuất lắp đặt", sales_issue: "Xuất bán", supplier_return: "Trả nhà cung cấp", transfer: "Điều chuyển",
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

export function filterStockMoves(
  moves: StockMove[],
  moveType: StockMoveType,
  filters: Record<string, string>,
  query: string,
) {
  const term = query.trim().toLowerCase();
  return moves.filter((move) => {
    if (move.type !== moveType) return false;
    if (filters.status && move.status !== filters.status) return false;
    if (filters.ownerId && move.owner.id !== filters.ownerId) return false;
    if (filters.supplierId && move.supplierId !== filters.supplierId) return false;
    if (filters.customerId && move.customerId !== filters.customerId) return false;
    if (filters.projectId && move.projectId !== filters.projectId) return false;
    if (!term) return true;
    return move.code.toLowerCase().includes(term) || move.lines.some((line) => line.productName.toLowerCase().includes(term));
  });
}

export function StockMovesTable({ moveType }: Props) {
  const list = useListPage();
  const { moves, loading, postMove } = useInventory();
  const { toast } = useToast();

  const filtered = useMemo(() => filterStockMoves(moves, moveType, list.filters, list.query), [moves, moveType, list.filters, list.query]);

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
      id: "reason",
      header: "Nghiệp vụ",
      cell: (r) => <span className="text-muted">{REASON_LABEL[r.reason] ?? "—"}</span>,
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
      cell: (r) => r.owner?.name ?? "—",
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
        loading={loading}
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
