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
import { isDateInRange } from "@/features/shared/utils/date";
import { useToast } from "@/components/ui/toast";
import { formatVnd } from "@/features/shared/utils/money";
import { CheckCircle2, ShoppingCart } from "lucide-react";
import { useMemo } from "react";
import { OrderStatusBadge } from "./order-status";

export function OrdersTable() {
  const list = useListPage();
  const { rows, loading, confirm } = useOrders({
    query: list.query,
    status: list.filters.status,
  });
  const { getById: getCustomer } = useCustomers();
  const { all: quotes } = useQuotes();
  const { toast } = useToast();

  const filtered = useMemo(() => {
    let result = rows;
    if (list.filters.customerId) {
      const ids = list.filters.customerId.split(",").filter(Boolean);
      if (ids.length > 0) result = result.filter((r) => ids.includes(r.customerId));
    }
    if (list.filters.ownerId) {
      const ids = list.filters.ownerId.split(",").filter(Boolean);
      if (ids.length > 0) result = result.filter((r) => ids.includes(r.owner.id));
    }
    if (list.filters.fromDate || list.filters.toDate) {
      result = result.filter((r) =>
        isDateInRange(r.createdAt, list.filters.fromDate, list.filters.toDate),
      );
    }
    if (list.query.trim()) {
      const q = list.query.toLowerCase().trim();
      result = result.filter((r) => {
        const c = getCustomer(r.customerId);
        return (
          r.code.toLowerCase().includes(q) ||
          (c?.name && c.name.toLowerCase().includes(q)) ||
          (c?.code && c.code.toLowerCase().includes(q)) ||
          (c?.phone && c.phone.includes(q))
        );
      });
    }
    return result;
  }, [rows, list.filters.customerId, list.filters.ownerId, list.filters.fromDate, list.filters.toDate, list.query, getCustomer]);

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
      id: "customer",
      header: "Khách hàng",
      cell: (r) => {
        const c = getCustomer(r.customerId);
        const name = c?.name ?? "—";
        return (
          <span className="font-medium text-foreground text-xs truncate max-w-[200px] block whitespace-nowrap" title={name}>
            {name}
          </span>
        );
      },
    },
    {
      id: "quoteId",
      header: "Báo giá",
      cell: (r) => {
        if (!r.quoteId) return <span className="text-muted whitespace-nowrap">—</span>;
        const q = quotes.find((x) => x.id === r.quoteId);
        const text = q?.code ?? r.quoteId;
        return (
          <span className="text-muted text-xs truncate max-w-[140px] block whitespace-nowrap" title={text}>
            {text}
          </span>
        );
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
      cell: (r) => <span className="font-mono text-xs font-semibold text-foreground whitespace-nowrap">{formatVnd(r.total)}</span>,
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
        loading={loading}
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
