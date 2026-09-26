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
import { formatDate, isDateInRange } from "@/features/shared/utils/date";
import { Handshake } from "lucide-react";
import { useMemo } from "react";
import { ContractStatusBadge } from "./contract-status";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";

export function ContractsTable() {
  const list = useListPage();
  const { rows, loading } = useContracts({
    query: list.query,
    status: list.filters.status,
    customerId: list.filters.customerId,
  });
  const { getById: getCustomer } = useCustomers();
  const { all: quotes } = useQuotes();
  const { canEdit } = useCurrentUser();

  const filtered = useMemo(() => {
    let result = rows;
    if (list.filters.ownerId) {
      result = result.filter((r) => r.owner.id === list.filters.ownerId);
    }
    if (list.query.trim()) {
      const q = list.query.toLowerCase().trim();
      result = result.filter((r) => {
        const c = getCustomer(r.customerId);
        return (
          r.code.toLowerCase().includes(q) ||
          (c?.name && c.name.toLowerCase().includes(q)) ||
          (c?.phone && c.phone.includes(q))
        );
      });
    }
    if (list.filters.fromDate || list.filters.toDate) {
      result = result.filter((r) =>
        isDateInRange(r.startDate || r.createdAt, list.filters.fromDate, list.filters.toDate),
      );
    }
    return result;
  }, [rows, list.filters.ownerId, list.filters.fromDate, list.filters.toDate, list.query, getCustomer]);

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
      cell: (r) => <ContractStatusBadge status={r.status} />,
    },
    {
      id: "value",
      header: "Giá trị",
      cell: (r) => <span className="font-mono text-xs font-semibold text-foreground whitespace-nowrap">{formatVnd(r.value)}</span>,
    },
    {
      id: "startDate",
      header: "Bắt đầu",
      sortable: true,
      cell: (r) => <span className="text-muted text-xs whitespace-nowrap">{formatDate(r.startDate)}</span>,
    },
    {
      id: "endDate",
      header: "Kết thúc",
      sortable: true,
      cell: (r) => <span className="text-muted text-xs whitespace-nowrap">{formatDate(r.endDate)}</span>,
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
          onEdit={canEdit("contracts", r.owner.id) ? () => list.setEditId(r.id) : undefined}
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
