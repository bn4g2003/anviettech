"use client";

import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { Pagination } from "@/components/datagrid/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { useFinance } from "@/features/finance/hooks/use-finance";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatVnd } from "@/features/shared/utils/money";
import { Wallet } from "lucide-react";
import { useMemo } from "react";

type DebtRow = {
  id: string;
  customerId: string;
  customerName: string;
  debt: number;
  invoiceCount: number;
};

export function DebtsTable() {
  const list = useListPage();
  const { debts, loading } = useFinance();

  const filtered = useMemo(() => {
    const q = list.query.trim().toLowerCase();
    if (!q) return debts as DebtRow[];
    return (debts as DebtRow[]).filter((d) =>
      d.customerName.toLowerCase().includes(q),
    );
  }, [debts, list.query]);

  const sorted = useMemo(() => {
    if (!list.sortKey) return filtered;
    const dir = list.sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (list.sortKey === "debt" || list.sortKey === "invoiceCount") {
        return (
          ((a[list.sortKey as "debt" | "invoiceCount"] as number) -
            (b[list.sortKey as "debt" | "invoiceCount"] as number)) *
          dir
        );
      }
      return a.customerName.localeCompare(b.customerName, "vi") * dir;
    });
  }, [filtered, list.sortKey, list.sortDir]);

  const pageRows = list.paginate(sorted);

  const allColumns: DataGridColumn<DebtRow>[] = [
    {
      id: "customer",
      header: "Khách hàng",
      sortable: true,
      cell: (r) => <span className="font-medium">{r.customerName}</span>,
    },
    {
      id: "debt",
      header: "Công nợ",
      sortable: true,
      cell: (r) => (
        <span className="font-medium text-danger">{formatVnd(r.debt)}</span>
      ),
    },
    {
      id: "invoiceCount",
      header: "Số HĐ",
      sortable: true,
      cell: (r) => r.invoiceCount,
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
            icon={Wallet}
            title="Không có công nợ"
            description="Tất cả hóa đơn đã được thanh toán."
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
