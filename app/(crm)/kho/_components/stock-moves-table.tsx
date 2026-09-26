"use client";

import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { Pagination } from "@/components/datagrid/pagination";
import { RowActions } from "@/components/datagrid/row-actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import type { StockMove, StockMoveType } from "@/features/inventory/types";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { isDateInRange } from "@/features/shared/utils/date";
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

export function businessContextLabel(move: Pick<StockMove, "supplier" | "customer" | "project">) {
  const reference = move.supplier ?? move.customer ?? move.project;
  return reference ? `${reference.code} — ${reference.name}` : "—";
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
    if (filters.status) {
      const statuses = filters.status.split(",").filter(Boolean);
      if (statuses.length > 0 && !statuses.includes(move.status)) return false;
    }
    if (filters.warehouseId) {
      const whIds = filters.warehouseId.split(",").filter(Boolean);
      if (whIds.length > 0) {
        const matchWh =
          (move.warehouseFromId && whIds.includes(move.warehouseFromId)) ||
          (move.warehouseToId && whIds.includes(move.warehouseToId)) ||
          whIds.some((id) => (move.warehouseFrom && move.warehouseFrom.includes(id)) || (move.warehouseTo && move.warehouseTo.includes(id)));
        if (!matchWh) return false;
      }
    }
    if (filters.ownerId) {
      const ownerIds = filters.ownerId.split(",").filter(Boolean);
      if (ownerIds.length > 0 && (!move.owner?.id || !ownerIds.includes(move.owner.id))) return false;
    }
    if (filters.supplierId) {
      const supplierIds = filters.supplierId.split(",").filter(Boolean);
      if (supplierIds.length > 0 && (!move.supplierId || !supplierIds.includes(move.supplierId))) return false;
    }
    if (filters.customerId) {
      const customerIds = filters.customerId.split(",").filter(Boolean);
      if (customerIds.length > 0 && (!move.customerId || !customerIds.includes(move.customerId))) return false;
    }
    if (filters.projectId) {
      const projectIds = filters.projectId.split(",").filter(Boolean);
      if (projectIds.length > 0 && (!move.projectId || !projectIds.includes(move.projectId))) return false;
    }
    if (filters.fromDate || filters.toDate) {
      if (!isDateInRange(move.createdAt, filters.fromDate, filters.toDate)) return false;
    }
    if (!term) return true;
    const matchCode = move.code.toLowerCase().includes(term);
    const matchLine = move.lines.some((line) => line.productName.toLowerCase().includes(term));
    const matchSupplier = Boolean(
      move.supplier &&
        ((move.supplier.name && move.supplier.name.toLowerCase().includes(term)) ||
          (move.supplier.code && move.supplier.code.toLowerCase().includes(term))),
    );
    const matchCustomer = Boolean(
      move.customer &&
        ((move.customer.name && move.customer.name.toLowerCase().includes(term)) ||
          (move.customer.code && move.customer.code.toLowerCase().includes(term))),
    );
    const matchProject = Boolean(
      move.project &&
        ((move.project.name && move.project.name.toLowerCase().includes(term)) ||
          (move.project.code && move.project.code.toLowerCase().includes(term))),
    );
    const matchWarehouse = Boolean(
      (move.warehouseFrom && move.warehouseFrom.toLowerCase().includes(term)) ||
        (move.warehouseTo && move.warehouseTo.toLowerCase().includes(term)),
    );
    const matchOrder = Boolean(move.orderId && move.orderId.toLowerCase().includes(term));
    const matchReason = Boolean(
      move.reason &&
        ((REASON_LABEL[move.reason] && REASON_LABEL[move.reason].toLowerCase().includes(term)) ||
          move.reason.toLowerCase().includes(term)),
    );
    const matchNote = Boolean(move.note && move.note.toLowerCase().includes(term));

    return (
      matchCode ||
      matchLine ||
      matchSupplier ||
      matchCustomer ||
      matchProject ||
      matchWarehouse ||
      matchOrder ||
      matchReason ||
      matchNote
    );
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
      cell: (r) => (
        <span
          className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer whitespace-nowrap"
          onClick={(e) => {
            e.stopPropagation();
            list.setViewId(r.id);
          }}
        >
          {r.code}
        </span>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (r) => <StockMoveStatusBadge status={r.status} />,
    },
    {
      id: "reason",
      header: "Nghiệp vụ",
      cell: (r) => <span className="text-muted text-xs truncate max-w-[130px] block whitespace-nowrap">{REASON_LABEL[r.reason] ?? "—"}</span>,
    },
    {
      id: "warehouse",
      header: "Kho",
      cell: (r) => <span className="text-muted text-xs truncate max-w-[140px] block whitespace-nowrap">{warehouseLabel(r)}</span>,
    },
    {
      id: "businessContext",
      header: "Liên quan",
      cell: (r) => <span className="text-muted text-xs truncate max-w-[160px] block whitespace-nowrap">{businessContextLabel(r)}</span>,
    },
    {
      id: "orderId",
      header: "Đơn hàng",
      cell: (r) => (
        <span className="font-mono text-xs text-muted whitespace-nowrap">{r.orderId ?? "—"}</span>
      ),
    },
    {
      id: "lines",
      header: "Dòng hàng",
      cell: (r) => <span className="text-muted text-xs truncate max-w-[180px] block whitespace-nowrap">{linesSummary(r)}</span>,
    },
    {
      id: "owner",
      header: "Phụ trách",
      cell: (r) => {
        const ownerName = r.owner?.name || "—";
        return (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-bg text-[10px] font-medium">
              {ownerName.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-xs">{ownerName}</span>
          </span>
        );
      },
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
