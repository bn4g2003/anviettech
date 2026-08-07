"use client";

import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { Pagination } from "@/components/datagrid/pagination";
import { RowActions } from "@/components/datagrid/row-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { useContracts } from "@/features/contracts/hooks/use-contracts";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useQuotes } from "@/features/quotes/hooks/use-quotes";
import type { Contract } from "@/features/contracts/types";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatVnd } from "@/features/shared/utils/money";
import { formatDate } from "@/features/shared/utils/date";
import { Handshake } from "lucide-react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ContractStatusBadge } from "./contract-status";

export function ContractsTable() {
  const list = useListPage();
  const router = useRouter();
  const { rows } = useContracts({
    query: list.query,
    status: list.filters.status,
    customerId: list.filters.customerId,
  });
  const { getById: getCustomer } = useCustomers();
  const { all: quotes } = useQuotes();

  const filtered = useMemo(() => {
    let result = rows;
    if (list.filters.ownerId) {
      result = result.filter((r) => r.owner.id === list.filters.ownerId);
    }
    return result;
  }, [rows, list.filters.ownerId]);

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

  const allColumns: DataGridColumn<Contract>[] = [
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
      cell: (r) => <ContractStatusBadge status={r.status} />,
    },
    {
      id: "value",
      header: "Giá trị",
      cell: (r) => <span className="font-medium tabular-nums">{formatVnd(r.value)}</span>,
    },
    {
      id: "startDate",
      header: "Bắt đầu",
      sortable: true,
      cell: (r) => <span className="text-muted">{formatDate(r.startDate)}</span>,
    },
    {
      id: "endDate",
      header: "Kết thúc",
      sortable: true,
      cell: (r) => <span className="text-muted">{formatDate(r.endDate)}</span>,
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
        <RowActions onView={() => router.push(`/hop-dong/${r.id}`)} />
      ),
    },
  ];

  const columns = allColumns.filter((c) => list.visibleColumns.includes(c.id));

  return (
    <>
      <DataGrid
        columns={columns}
        rows={pageRows}
        onRowClick={(r) => router.push(`/hop-dong/${r.id}`)}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.toggleSort}
        empty={
          <EmptyState
            icon={Handshake}
            title="Không có hợp đồng"
            description="Hợp đồng được tạo tự động khi duyệt báo giá."
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
