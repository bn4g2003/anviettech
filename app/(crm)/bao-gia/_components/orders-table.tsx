"use client";

import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { Pagination } from "@/components/datagrid/pagination";
import { RowActions } from "@/components/datagrid/row-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/features/orders/hooks/use-orders";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useQuotes } from "@/features/quotes/hooks/use-quotes";
import { inventoryService } from "@/features/inventory/services/inventory-service";
import type { Order } from "@/features/orders/types";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useToast } from "@/components/ui/toast";
import { formatVnd } from "@/features/shared/utils/money";
import { CheckCircle2, ShoppingCart } from "lucide-react";
import { useMemo } from "react";
import { OrderStatusBadge } from "./order-status";

export function OrdersTable() {
  const list = useListPage();
  const { rows, confirm } = useOrders({
    query: list.query,
    status: list.filters.status,
  });
  const { getById: getCustomer } = useCustomers();
  const { all: quotes } = useQuotes();
  const { toast } = useToast();

  const filtered = useMemo(() => {
    let result = rows;
    if (list.filters.customerId) {
      result = result.filter((r) => r.customerId === list.filters.customerId);
    }
    if (list.filters.ownerId) {
      result = result.filter((r) => r.owner.id === list.filters.ownerId);
    }
    return result;
  }, [rows, list.filters.customerId, list.filters.ownerId]);

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

  async function handleConfirm(id: string) {
    try {
      const warehouses = await inventoryService.listWarehouses();
      const warehouseId = warehouses.find((w) => w.isDefault)?.id ?? warehouses[0]?.id;
      if (!warehouseId) {
        toast("Chưa có kho mặc định", "error");
        return;
      }
      await confirm(id, warehouseId);
      toast("Đã xác nhận đơn — phiếu xuất & hóa đơn đã tạo", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Lỗi xác nhận đơn", "error");
    }
  }

  const allColumns: DataGridColumn<Order>[] = [
    {
      id: "code",
      header: "Mã",
      width: "w-24",
      sortable: true,
      cell: (r) => <span className="font-mono text-xs">{r.code}</span>,
    },
    {
      id: "customer",
      header: "Khách hàng",
      cell: (r) => {
        const c = getCustomer(r.customerId);
        return <span className="font-medium">{c?.name ?? "—"}</span>;
      },
    },
    {
      id: "quoteId",
      header: "Báo giá",
      cell: (r) => {
        if (!r.quoteId) return <span className="text-muted">—</span>;
        const q = quotes.find((x) => x.id === r.quoteId);
        return <span className="text-muted">{q?.code ?? r.quoteId}</span>;
      },
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (r) => <OrderStatusBadge status={r.status} />,
    },
    {
      id: "total",
      header: "Tổng tiền",
      cell: (r) => <span className="font-medium tabular-nums">{formatVnd(r.total)}</span>,
    },
    {
      id: "owner",
      header: "Phụ trách",
      cell: (r) => (
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-bg text-[10px]">
            {r.owner.name.slice(0, 1)}
          </span>
          {r.owner.name}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      sticky: "right",
      cell: (r) => (
        <RowActions
          onView={() => list.setViewId(r.id)}
          extra={
            r.status === "draft" ? (
              <Button
                variant="ghost"
                size="icon"
                title="Xác nhận đơn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirm(r.id);
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
            icon={ShoppingCart}
            title="Không có đơn hàng"
            description="Đơn hàng được tạo khi duyệt báo giá."
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
