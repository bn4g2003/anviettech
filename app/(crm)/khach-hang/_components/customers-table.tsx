"use client";

import { cn } from "@/lib/cn";
import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { Pagination } from "@/components/datagrid/pagination";
import { RowActions } from "@/components/datagrid/row-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { CustomerStatusBadge } from "@/features/customers/components/customer-status-badge";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import type { Customer } from "@/features/customers/types";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatVnd } from "@/features/shared/utils/money";
import { formatDate, relativeTime } from "@/features/shared/utils/date";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { Users } from "lucide-react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { scopeForCustomerView } from "@/features/customers/customer-scope";

export function CustomersTable() {
  const list = useListPage();
  const router = useRouter();
  const { canEdit, canDelete } = useCurrentUser();
  const { rows, loading, getDebt, removeMany } = useCustomers({
    query: list.query,
    status: list.filters.status,
    type: list.filters.type,
    ownerId: list.filters.ownerId,
    scope: scopeForCustomerView(list.filters.view),
  });

  const sorted = useMemo(() => {
    if (!list.sortKey) return rows;
    const dir = list.sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (list.sortKey === "debt") {
        return (getDebt(a.id) - getDebt(b.id)) * dir;
      }
      const av = String((a as Record<string, unknown>)[list.sortKey] ?? "");
      const bv = String((b as Record<string, unknown>)[list.sortKey] ?? "");
      return av.localeCompare(bv, "vi") * dir;
    });
  }, [rows, list.sortKey, list.sortDir, getDebt]);

  const pageRows = list.paginate(sorted);

  const allColumns: DataGridColumn<Customer>[] = [
    {
      id: "code",
      header: "Mã KH",
      width: "w-36 min-w-[140px]",
      sortable: true,
      cell: (r) => (
        <span
          className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer whitespace-nowrap"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/khach-hang/${r.id}`);
          }}
        >
          {r.code}
        </span>
      ),
    },
    {
      id: "name",
      header: "Tổ chức / Tên KH",
      sortable: true,
      cell: (r) => {
        const name = r.name || "Khách hàng";
        return (
          <div className="flex items-center gap-2 min-w-[160px]">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-2xs"
              style={{ background: r.logoColor ?? "#3b82f6" }}
            >
              {name.slice(0, 1).toUpperCase()}
            </span>
            <span className="font-semibold text-foreground truncate max-w-[220px]" title={name}>
              {name}
            </span>
          </div>
        );
      },
    },
    {
      id: "type",
      header: "Phân loại",
      sortable: true,
      cell: (r) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap border",
            r.type === "individual"
              ? "bg-sky-50 text-sky-700 border-sky-200"
              : "bg-indigo-50 text-indigo-700 border-indigo-200",
          )}
        >
          {r.type === "individual" ? "Cá nhân" : "Doanh nghiệp"}
        </span>
      ),
    },
    {
      id: "contactName",
      header: "Người liên hệ",
      sortable: true,
      cell: (r) => (
        <span className="text-foreground text-xs font-medium truncate max-w-[140px] block" title={r.contactName || ""}>
          {r.contactName || "—"}
        </span>
      ),
    },
    {
      id: "phone",
      header: "Số điện thoại",
      cell: (r) => (
        <span className="font-mono text-xs whitespace-nowrap">{r.phone || "—"}</span>
      ),
    },
    {
      id: "email",
      header: "Email",
      cell: (r) => (
        <span className="text-muted text-xs truncate max-w-[160px] block" title={r.email || ""}>
          {r.email || "—"}
        </span>
      ),
    },
    {
      id: "address",
      header: "Địa chỉ",
      cell: (r) => (
        <span className="text-muted text-xs truncate max-w-[200px] block" title={r.address || ""}>
          {r.address || "—"}
        </span>
      ),
    },
    {
      id: "source",
      header: "Nguồn khách",
      sortable: true,
      cell: (r) => (
        <span className="text-muted text-xs capitalize whitespace-nowrap">
          {r.source || "—"}
        </span>
      ),
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
      id: "debt",
      header: "Công nợ",
      sortable: true,
      cell: (r) => {
        const debt = getDebt(r.id);
        return (
          <span
            className={`font-mono text-xs whitespace-nowrap ${
              debt > 0 ? "font-semibold text-danger" : "text-muted"
            }`}
          >
            {formatVnd(debt)}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Trạng thái",
      sortable: true,
      cell: (r) => <CustomerStatusBadge status={r.status} />,
    },
    {
      id: "updatedAt",
      header: "Cập nhật",
      sortable: true,
      cell: (r) => <span className="text-muted text-xs whitespace-nowrap">{relativeTime(r.updatedAt)}</span>,
    },
    {
      id: "createdAt",
      header: "Ngày tạo",
      sortable: true,
      cell: (r) => <span className="text-muted text-xs whitespace-nowrap">{formatDate(r.createdAt)}</span>,
    },
    {
      id: "actions",
      header: "Thao tác",
      sticky: "right",
      width: "w-28",
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
