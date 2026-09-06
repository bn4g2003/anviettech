"use client";

import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { Pagination } from "@/components/datagrid/pagination";
import { RowActions } from "@/components/datagrid/row-actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useFinance } from "@/features/finance/hooks/use-finance";
import type { Invoice } from "@/features/finance/types";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatDate } from "@/features/shared/utils/date";
import { formatVnd } from "@/features/shared/utils/money";
import { Banknote, Receipt } from "lucide-react";
import { useMemo } from "react";
import { InvoiceStatusBadge } from "./invoice-status";

export function InvoicesTable() {
  const list = useListPage();
  const { invoices, loading } = useFinance({
    query: list.query,
    invoiceStatus: list.filters.invoiceStatus,
    customerId: list.filters.customerId,
  });
  const { getById: getCustomer } = useCustomers();

  const sorted = useMemo(() => {
    let result = invoices;
    if (list.filters.customerId) {
      result = result.filter((i) => i.customerId === list.filters.customerId);
    }
    if (list.filters.invoiceStatus) {
      result = result.filter((i) => i.status === list.filters.invoiceStatus);
    }
    if (!list.sortKey) return result;
    const dir = list.sortDir === "asc" ? 1 : -1;
    return [...result].sort((a, b) => {
      if (list.sortKey === "amount" || list.sortKey === "paidAmount") {
        return (
          ((a[list.sortKey as "amount" | "paidAmount"] as number) -
            (b[list.sortKey as "amount" | "paidAmount"] as number)) *
          dir
        );
      }
      if (list.sortKey === "remaining") {
        const aRem = a.amount - a.paidAmount;
        const bRem = b.amount - b.paidAmount;
        return (aRem - bRem) * dir;
      }
      if (list.sortKey === "customer") {
        const aName = a.customerName || getCustomer(a.customerId)?.name || "";
        const bName = b.customerName || getCustomer(b.customerId)?.name || "";
        return aName.localeCompare(bName, "vi") * dir;
      }
      const av = String((a as Record<string, unknown>)[list.sortKey] ?? "");
      const bv = String((b as Record<string, unknown>)[list.sortKey] ?? "");
      return av.localeCompare(bv, "vi") * dir;
    });
  }, [invoices, list.sortKey, list.sortDir, list.filters.customerId, list.filters.invoiceStatus, getCustomer]);

  const pageRows = list.paginate(sorted);

  const allColumns: DataGridColumn<Invoice>[] = [
    {
      id: "code",
      header: "Mã",
      width: "w-40 min-w-[150px]",
      sortable: true,
      cell: (r) => (
        <span
          className="font-mono text-xs font-medium leading-tight line-clamp-2 break-all"
          title={r.code}
        >
          {r.code}
        </span>
      ),
    },
    {
      id: "customer",
      header: "Khách hàng",
      width: "w-52 max-w-[220px]",
      sortable: true,
      cell: (r) => {
        const name = r.customerName || getCustomer(r.customerId)?.name || "—";
        return (
          <span className="block max-w-[210px] truncate text-sm" title={name}>
            {name}
          </span>
        );
      },
    },
    {
      id: "amount",
      header: "Số tiền",
      width: "w-32",
      sortable: true,
      cell: (r) => <span className="font-medium whitespace-nowrap">{formatVnd(r.amount)}</span>,
    },
    {
      id: "paidAmount",
      header: "Đã TT",
      width: "w-32",
      sortable: true,
      cell: (r) => <span className="text-muted whitespace-nowrap">{formatVnd(r.paidAmount)}</span>,
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (r) => <InvoiceStatusBadge status={r.status} />,
    },
    {
      id: "dueDate",
      header: "Hạn TT",
      sortable: true,
      cell: (r) => <span className="text-muted">{formatDate(r.dueDate)}</span>,
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
          extra={
            r.status === "unpaid" || r.status === "partial" ? (
              <Button
                variant="ghost"
                size="icon"
                title="Ghi thanh toán"
                onClick={(e) => {
                  e.stopPropagation();
                  list.setFilter("payInvoiceId", r.id);
                  list.setCreateOpen(true);
                }}
              >
                <Banknote className="h-3.5 w-3.5" />
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
            icon={Receipt}
            title="Không có hóa đơn"
            description="Thử đổi bộ lọc hoặc ghi thanh toán từ đơn hàng."
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
