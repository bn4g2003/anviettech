"use client";

import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { Pagination } from "@/components/datagrid/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useFinance } from "@/features/finance/hooks/use-finance";
import type { Payment, PaymentMethod } from "@/features/finance/types";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatDateTime } from "@/features/shared/utils/date";
import { formatVnd } from "@/features/shared/utils/money";
import { CreditCard } from "lucide-react";
import { useMemo } from "react";

const METHOD_LABEL: Record<PaymentMethod, string> = {
  bank: "Chuyển khoản",
  cash: "Tiền mặt",
  card: "Thẻ",
  other: "Khác",
};

export function PaymentsTable() {
  const list = useListPage();
  const { payments, loading, getById: getInvoice } = useFinance({
    query: list.query,
    customerId: list.filters.customerId,
  });
  const { getById: getCustomer } = useCustomers();

  const filtered = useMemo(() => {
    const q = list.query.trim().toLowerCase();
    const custFilter = list.filters.customerId;
    const methodFilter = list.filters.method;
    return payments.filter((p) => {
      if (methodFilter && p.method !== methodFilter) return false;
      if (custFilter && p.customerId !== custFilter) return false;
      if (!q) return true;
      const inv = getInvoice(p.invoiceId);
      const custName = p.customerName || getCustomer(p.customerId)?.name || "";
      return (
        p.code.toLowerCase().includes(q) ||
        (inv?.code.toLowerCase().includes(q) ?? false) ||
        custName.toLowerCase().includes(q)
      );
    });
  }, [payments, list.query, list.filters.method, list.filters.customerId, getInvoice, getCustomer]);

  const sorted = useMemo(() => {
    const sortKey = list.sortKey || "paidAt";
    const dir = list.sortKey ? (list.sortDir === "asc" ? 1 : -1) : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "amount") return (a.amount - b.amount) * dir;
      if (sortKey === "customer") {
        const aName = a.customerName || getCustomer(a.customerId)?.name || "";
        const bName = b.customerName || getCustomer(b.customerId)?.name || "";
        return aName.localeCompare(bName, "vi") * dir;
      }
      const av = String((a as Record<string, unknown>)[sortKey] ?? "");
      const bv = String((b as Record<string, unknown>)[sortKey] ?? "");
      return av.localeCompare(bv, "vi") * dir;
    });
  }, [filtered, list.sortKey, list.sortDir, getCustomer]);

  const pageRows = list.paginate(sorted);

  const allColumns: DataGridColumn<Payment>[] = [
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
      id: "invoice",
      header: "Hóa đơn",
      width: "w-36 min-w-[130px]",
      cell: (r) => {
        const invCode = getInvoice(r.invoiceId)?.code ?? "—";
        return (
          <span
            className="font-mono text-xs text-muted leading-tight line-clamp-2 break-all"
            title={invCode}
          >
            {invCode}
          </span>
        );
      },
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
      id: "method",
      header: "Phương thức",
      width: "w-28",
      cell: (r) => METHOD_LABEL[r.method],
    },
    {
      id: "paidAt",
      header: "Ngày TT",
      width: "w-36",
      sortable: true,
      cell: (r) => <span className="text-muted whitespace-nowrap">{formatDateTime(r.paidAt)}</span>,
    },
    {
      id: "owner",
      header: "Phụ trách",
      cell: (r) => r.owner?.name ?? "—",
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
            icon={CreditCard}
            title="Không có thanh toán"
            description="Ghi thanh toán từ tab Hóa đơn."
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
