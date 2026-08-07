"use client";

import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { Pagination } from "@/components/datagrid/pagination";
import { RowActions } from "@/components/datagrid/row-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatDateTime, relativeTime } from "@/features/shared/utils/date";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import type { Task } from "@/features/tasks/types";
import { TASK_TYPE_LABEL } from "@/features/tasks/types";
import { CheckSquare } from "lucide-react";
import { useMemo } from "react";
import { TaskStatusBadge } from "./task-status";

export function TasksTable() {
  const list = useListPage();
  const { rows, loading, removeMany } = useTasks({
    query: list.query,
    status: list.filters.status,
    type: list.filters.type,
    ownerId: list.filters.ownerId,
    view: list.filters.view,
    scope: list.filters.view === "my" ? "my" : undefined,
  });
  const { getById: getCustomer } = useCustomers();
  const { getById: getDeal } = useDeals();

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

  const allColumns: DataGridColumn<Task>[] = [
    {
      id: "title",
      header: "Tiêu đề",
      sortable: true,
      cell: (r) => <span className="font-medium">{r.title}</span>,
    },
    {
      id: "type",
      header: "Loại",
      cell: (r) => TASK_TYPE_LABEL[r.type],
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (r) => <TaskStatusBadge status={r.status} />,
    },
    {
      id: "dueAt",
      header: "Hạn",
      sortable: true,
      cell: (r) => (
        <span className="text-muted" title={relativeTime(r.dueAt)}>
          {formatDateTime(r.dueAt)}
        </span>
      ),
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
      id: "customer",
      header: "Khách hàng",
      cell: (r) =>
        r.customerId ? (
          <span className="text-muted">{getCustomer(r.customerId)?.name ?? "—"}</span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      id: "deal",
      header: "Cơ hội",
      cell: (r) =>
        r.dealId ? (
          <span className="text-muted">{getDeal(r.dealId)?.title ?? "—"}</span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      id: "actions",
      header: "Thao tác",
      sticky: "right",
      cell: (r) => (
        <RowActions
          onView={() => list.setViewId(r.id)}
          onEdit={() => list.setEditId(r.id)}
          onDelete={() => list.setDeleteId(r.id)}
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
        onRowClick={(r) => list.setViewId(r.id)}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.toggleSort}
        loading={loading}
        empty={
          <EmptyState
            icon={CheckSquare}
            title="Không có công việc"
            description="Thử đổi bộ lọc hoặc tạo công việc mới."
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
