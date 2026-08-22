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
  const { payments, loading, getById: getInvoice } = useFinance();
  const { getById: getCustomer } = useCustomers();

  const filtered = useMemo(() => {
    const q = list.query.trim().toLowerCase();
    return payments.filter((p) => {
      if (list.filters.method && p.method !== list.filters.method) return false;
      if (!q) return true;
      const inv = getInvoice(p.invoiceId);
      const customer = getCustomer(p.customerId);
      return (
        p.code.toLowerCase().includes(q) ||
        (inv?.code.toLowerCase().includes(q) ?? false) ||
        (customer?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [payments, list.query, list.filters.method, getInvoice, getCustomer]);

  const sorted = useMemo(() => {
    if (!list.sortKey) return filtered;
    const dir = list.sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (list.sortKey === "amount") return (a.amount - b.amount) * dir;
      const av = String((a as Record<string, unknown>)[list.sortKey] ?? "");
      const bv = String((b as Record<string, unknown>)[list.sortKey] ?? "");
      return av.localeCompare(bv, "vi") * dir;
    });
  }, [filtered, list.sortKey, list.sortDir]);

  const pageRows = list.paginate(sorted);

  const allColumns: DataGridColumn<Payment>[] = [
    {
      id: "code",
      header: "Mã",
      width: "w-24",
      sortable: true,
      cell: (r) => <span className="font-mono text-xs">{r.code}</span>,
    },
    {
      id: "invoice",
      header: "Hóa đơn",
      cell: (r) => (
        <span className="font-mono text-xs text-muted">
          {getInvoice(r.invoiceId)?.code ?? r.invoiceId}
        </span>
      ),
    },
    {
      id: "customer",
      header: "Khách hàng",
      cell: (r) => getCustomer(r.customerId)?.name ?? r.customerId,
    },
    {
      id: "amount",
      header: "Số tiền",
      sortable: true,
      cell: (r) => <span className="font-medium">{formatVnd(r.amount)}</span>,
    },
    {
      id: "method",
      header: "Phương thức",
      cell: (r) => METHOD_LABEL[r.method],
    },
    {
      id: "paidAt",
      header: "Ngày TT",
      sortable: true,
      cell: (r) => <span className="text-muted">{formatDateTime(r.paidAt)}</span>,
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
