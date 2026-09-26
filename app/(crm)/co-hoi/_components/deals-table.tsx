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
import { useWinLoss } from "./win-loss-context";
import { parseClosedReason } from "@/features/deals/win-loss";
import { Briefcase, CheckCircle2, XCircle } from "lucide-react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

export function DealsTable() {
  const list = useListPage();
  const router = useRouter();
  const { canEdit, canDelete } = useCurrentUser();
  const { getById: getCustomer } = useCustomers();
  const winLoss = useWinLoss();

  const { rows, loading, removeMany } = useDeals({
    query: list.query,
    stage: (list.filters.stage as DealStage) || undefined,
    ownerId: list.filters.ownerId,
    customerId: list.filters.customerId,
  });

  const filtered = useMemo(() => {
    if (!list.query.trim()) return rows;
    const q = list.query.toLowerCase().trim();
    return rows.filter((r) => {
      const c = getCustomer(r.customerId);
      return (
        r.title.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        (c?.name && c.name.toLowerCase().includes(q)) ||
        (c?.phone && c.phone.includes(q)) ||
        (r.notes && r.notes.toLowerCase().includes(q))
      );
    });
  }, [rows, list.query, getCustomer]);

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

  const allColumns: DataGridColumn<Deal>[] = [
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
            router.push(`/co-hoi/${r.id}`);
          }}
        >
          {r.code}
        </span>
      ),
    },
    {
      id: "title",
      header: "Tiêu đề",
      sortable: true,
      cell: (r) => (
        <span className="font-semibold text-foreground truncate max-w-[220px] block whitespace-nowrap" title={r.title}>
          {r.title}
        </span>
      ),
    },
    {
      id: "customer",
      header: "Khách hàng",
      cell: (r) => {
        const c = getCustomer(r.customerId);
        const name = c?.name ?? r.customerId;
        return (
          <span className="text-foreground text-xs truncate max-w-[180px] block whitespace-nowrap" title={name}>
            {name}
          </span>
        );
      },
    },
    {
      id: "stage",
      header: "Giai đoạn",
      cell: (r) => {
        const meta = DEAL_STAGE_META[r.stage] ?? { label: r.stage || "—", color: "blue", probability: 0 };
        const parsedReason =
          (r.stage === "won" || r.stage === "lost") && r.closedReason
            ? parseClosedReason(r.closedReason)
            : null;
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <StatusDot color={meta.color} label={meta.label} />
            {parsedReason ? (
              <span
                className="text-[10px] font-medium truncate max-w-[130px] text-muted"
                title={r.closedReason}
              >
                ({parsedReason.category})
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "value",
      header: "Giá trị",
      sortable: true,
      cell: (r) => <span className="font-mono text-xs font-semibold text-foreground whitespace-nowrap">{formatVnd(r.value)}</span>,
    },
    {
      id: "probability",
      header: "Xác suất",
      cell: (r) => <span className="text-muted text-xs whitespace-nowrap">{r.probability ?? 0}%</span>,
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
      id: "expectedCloseDate",
      header: "Dự kiến chốt",
      cell: (r) => (
        <span className="text-muted text-xs whitespace-nowrap">{formatDate(r.expectedCloseDate)}</span>
      ),
    },
    {
      id: "updatedAt",
      header: "Cập nhật",
      sortable: true,
      cell: (r) => <span className="text-muted text-xs whitespace-nowrap">{relativeTime(r.updatedAt)}</span>,
    },
    {
      id: "actions",
      header: "Thao tác",
      sticky: "right",
      cell: (r) => (
        <div className="flex items-center gap-1">
          {r.stage !== "won" && r.stage !== "lost" && canEdit("deals", r.owner?.id) ? (
            <>
              <button
                type="button"
                className="h-6 w-6 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-muted-bg"
                title="Chốt Thắng (Won)"
                onClick={() => winLoss?.openWinLoss(r, "won")}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="h-6 w-6 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-muted-bg"
                title="Báo Thua (Lost)"
                onClick={() => winLoss?.openWinLoss(r, "lost")}
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </>
          ) : null}
          <RowActions
            onView={() => router.push(`/co-hoi/${r.id}`)}
            onEdit={canEdit("deals", r.owner?.id) ? () => list.setEditId(r.id) : undefined}
            onDelete={canDelete("deals", r.owner?.id) ? () => list.setDeleteId(r.id) : undefined}
          />
        </div>
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
