"use client";

import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { Pagination } from "@/components/datagrid/pagination";
import { RowActions } from "@/components/datagrid/row-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusDot } from "@/components/ui/status-dot";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { DEAL_STAGE_META, type Deal, type DealStage } from "@/features/deals/types";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatDate, relativeTime } from "@/features/shared/utils/date";
import { formatVnd } from "@/features/shared/utils/money";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { Briefcase } from "lucide-react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

export function DealsTable() {
  const list = useListPage();
  const router = useRouter();
  const { canEdit, canDelete } = useCurrentUser();
  const { getById: getCustomer } = useCustomers();

  const { rows, loading, removeMany } = useDeals({
    query: list.query,
    stage: (list.filters.stage as DealStage) || undefined,
    ownerId: list.filters.ownerId,
    customerId: list.filters.customerId,
  });

  const sorted = useMemo(() => {
    if (!list.sortKey) return rows;
    const dir = list.sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = String((a as Record<string, unknown>)[list.sortKey] ?? "");
      const bv = String((b as Record<string, unknown>)[list.sortKey] ?? "");
      return av.localeCompare(bv, "vi") * dir;
    });
  }, [rows, list.sortKey, list.sortDir]);

  const pageRows = list.paginate(sorted);

  const allColumns: DataGridColumn<Deal>[] = [
    {
      id: "code",
      header: "Mã",
      width: "w-24",
      sortable: true,
      cell: (r) => <span className="font-mono text-xs">{r.code}</span>,
    },
    {
      id: "title",
      header: "Tiêu đề",
      sortable: true,
      cell: (r) => <span className="font-medium">{r.title}</span>,
    },
    {
      id: "customer",
      header: "Khách hàng",
      cell: (r) => {
        const c = getCustomer(r.customerId);
        return <span>{c?.name ?? r.customerId}</span>;
      },
    },
    {
      id: "stage",
      header: "Giai đoạn",
      cell: (r) => {
        const meta = DEAL_STAGE_META[r.stage] ?? { label: r.stage || "—", color: "blue", probability: 0 };
        return <StatusDot color={meta.color} label={meta.label} />;
      },
    },
    {
      id: "value",
      header: "Giá trị",
      sortable: true,
      cell: (r) => <span className="font-medium">{formatVnd(r.value)}</span>,
    },
    {
      id: "probability",
      header: "Xác suất",
      cell: (r) => <span className="text-muted">{r.probability ?? 0}%</span>,
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
      id: "expectedCloseDate",
      header: "Dự kiến chốt",
      cell: (r) => (
        <span className="text-muted">{formatDate(r.expectedCloseDate)}</span>
      ),
    },
    {
      id: "updatedAt",
      header: "Cập nhật",
      sortable: true,
      cell: (r) => <span className="text-muted">{relativeTime(r.updatedAt)}</span>,
    },
    {
      id: "actions",
      header: "Thao tác",
      sticky: "right",
      cell: (r) => (
        <RowActions
          onView={() => router.push(`/co-hoi/${r.id}`)}
          onEdit={canEdit("deals", r.owner?.id) ? () => list.setEditId(r.id) : undefined}
          onDelete={canDelete("deals", r.owner?.id) ? () => list.setDeleteId(r.id) : undefined}
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
        onRowClick={(r) => router.push(`/co-hoi/${r.id}`)}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.toggleSort}
        loading={loading}
        empty={
          <EmptyState
            icon={Briefcase}
            title="Không có cơ hội"
            description="Thử đổi bộ lọc hoặc tạo cơ hội mới."
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
