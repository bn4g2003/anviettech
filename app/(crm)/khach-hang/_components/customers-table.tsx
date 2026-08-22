"use client";

import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { Pagination } from "@/components/datagrid/pagination";
import { RowActions } from "@/components/datagrid/row-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { CustomerStatusBadge } from "@/features/customers/components/customer-status-badge";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import type { Customer } from "@/features/customers/types";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatVnd } from "@/features/shared/utils/money";
import { relativeTime } from "@/features/shared/utils/date";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { Users } from "lucide-react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

export function CustomersTable() {
  const list = useListPage();
  const router = useRouter();
  const { canEdit, canDelete } = useCurrentUser();
  const { rows, loading, getDebt, removeMany } = useCustomers({
    query: list.query,
    status: list.filters.status,
    type: list.filters.type,
    ownerId: list.filters.ownerId,
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

  const allColumns: DataGridColumn<Customer>[] = [
    {
      id: "code",
      header: "Mã",
      width: "w-24",
      sortable: true,
      cell: (r) => <span className="font-mono text-xs">{r.code}</span>,
    },
    {
      id: "name",
      header: "Tổ chức",
      sortable: true,
      cell: (r) => {
        const name = r.name || "Khách hàng";
        return (
          <span className="inline-flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: r.logoColor ?? "#666" }}
            >
              {name.slice(0, 1)}
            </span>
            <span className="font-medium">{name}</span>
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (r) => <CustomerStatusBadge status={r.status} />,
    },
    {
      id: "email",
      header: "Email",
      cell: (r) => <span className="text-muted">{r.email || "—"}</span>,
    },
    {
      id: "phone",
      header: "SĐT",
      cell: (r) => r.phone || "—",
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
      id: "updatedAt",
      header: "Cập nhật",
      sortable: true,
      cell: (r) => <span className="text-muted">{relativeTime(r.updatedAt)}</span>,
    },
    {
      id: "debt",
      header: "Công nợ",
      cell: (r) => {
        const debt = getDebt(r.id);
        return (
          <span className={debt > 0 ? "font-medium text-danger" : "text-muted"}>
            {formatVnd(debt)}
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
          onView={() => router.push(`/khach-hang/${r.id}`)}
          onEdit={canEdit("customers", r.owner?.id) ? () => list.setEditId(r.id) : undefined}
          onDelete={canDelete("customers", r.owner?.id) ? () => list.setDeleteId(r.id) : undefined}
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
        onRowClick={(r) => router.push(`/khach-hang/${r.id}`)}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.toggleSort}
        loading={loading}
        empty={
          <EmptyState
            icon={Users}
            title="Không có khách hàng"
            description="Thử đổi bộ lọc hoặc tạo khách hàng mới."
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
