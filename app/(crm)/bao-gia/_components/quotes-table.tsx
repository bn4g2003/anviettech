"use client";

import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { Pagination } from "@/components/datagrid/pagination";
import { RowActions } from "@/components/datagrid/row-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { useQuotes } from "@/features/quotes/hooks/use-quotes";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useDeals } from "@/features/deals/hooks/use-deals";
import type { Quote } from "@/features/quotes/types";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatVnd } from "@/features/shared/utils/money";
import { formatDate } from "@/features/shared/utils/date";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { FileText } from "lucide-react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { QuoteStatusBadge } from "./quote-status";

export function QuotesTable() {
  const list = useListPage();
  const router = useRouter();
  const { canEdit, canDelete } = useCurrentUser();
  const { rows, loading, removeMany } = useQuotes({
    query: list.query,
    status: list.filters.status,
    customerId: list.filters.customerId,
  });
  const { getById: getCustomer } = useCustomers();
  const { all: deals } = useDeals();

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

  const allColumns: DataGridColumn<Quote>[] = [
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
      id: "deal",
      header: "Cơ hội",
      cell: (r) => {
        if (!r.dealId) return <span className="text-muted">—</span>;
        const d = deals.find((x) => x.id === r.dealId);
        return <span className="text-muted">{d?.code ?? r.dealId}</span>;
      },
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (r) => <QuoteStatusBadge status={r.status} />,
    },
    {
      id: "total",
      header: "Tổng tiền",
      cell: (r) => <span className="font-medium tabular-nums">{formatVnd(r.total)}</span>,
    },
    {
      id: "validUntil",
      header: "Hiệu lực đến",
      sortable: true,
      cell: (r) => <span className="text-muted">{formatDate(r.validUntil)}</span>,
    },
    {
      id: "owner",
      header: "Phụ trách",
      cell: (r) => {
        const ownerName = r.owner?.name || "—";
        return (
          <span className="inline-flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-bg text-[10px]">
              {ownerName.slice(0, 1)}
            </span>
            {ownerName}
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
          onView={() => router.push(`/bao-gia/${r.id}`)}
          onEdit={canEdit("quotes", r.owner?.id) ? () => list.setEditId(r.id) : undefined}
          onDelete={canDelete("quotes", r.owner?.id) ? () => list.setDeleteId(r.id) : undefined}
        />
      ),
    },
  ];

  const columns = allColumns.filter((c) => list.visibleColumns.includes(c.id));

  return (
    <>
      {list.selectedIds.length > 0 ? (
        <div className="flex h-9 items-center gap-2 border-b border-border bg-amber-50 px-3 text-xs">
          <span>Đã chọn {list.selectedIds.length}</span>
          <button
            type="button"
            className="font-medium text-danger underline"
            onClick={() => {
              removeMany(list.selectedIds);
              list.clearSelection();
            }}
          >
            Xóa đã chọn
          </button>
        </div>
      ) : null}
      <DataGrid
        columns={columns}
        rows={pageRows}
        selectedIds={list.selectedIds}
        onToggleSelect={list.toggleSelect}
        onToggleSelectAll={() => list.toggleSelectAll(pageRows.map((r) => r.id))}
        onRowClick={(r) => router.push(`/bao-gia/${r.id}`)}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.toggleSort}
        loading={loading}
        empty={
          <EmptyState
            icon={FileText}
            title="Không có báo giá"
            description="Thử đổi bộ lọc hoặc tạo báo giá mới."
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
