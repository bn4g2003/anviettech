"use client";

import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { Pagination } from "@/components/datagrid/pagination";
import { RowActions } from "@/components/datagrid/row-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { useMarketing } from "@/features/marketing/hooks/use-marketing";
import type { Campaign } from "@/features/marketing/types";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatDate } from "@/features/shared/utils/date";
import { formatVnd } from "@/features/shared/utils/money";
import { Megaphone } from "lucide-react";
import { useMemo } from "react";
import {
  CAMPAIGN_CHANNEL_LABELS,
  CampaignStatusBadge,
} from "./campaign-status";

export function CampaignsTable() {
  const list = useListPage();
  const { rows, loading } = useMarketing({
    query: list.query,
    status: list.filters.status,
    channel: list.filters.channel,
  });

  const sorted = useMemo(() => {
    if (!list.sortKey) return rows;
    const dir = list.sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const key = list.sortKey as keyof Campaign;
      const av = a[key];
      const bv = b[key];
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }
      return String(av ?? "").localeCompare(String(bv ?? ""), "vi") * dir;
    });
  }, [rows, list.sortKey, list.sortDir]);

  const pageRows = list.paginate(sorted);

  const allColumns: DataGridColumn<Campaign>[] = [
    {
      id: "code",
      header: "Mã",
      width: "w-24",
      sortable: true,
      cell: (r) => <span className="font-mono text-xs">{r.code}</span>,
    },
    {
      id: "name",
      header: "Tên chiến dịch",
      sortable: true,
      cell: (r) => <span className="font-medium">{r.name}</span>,
    },
    {
      id: "channel",
      header: "Kênh",
      cell: (r) => (
        <span className="text-muted">{CAMPAIGN_CHANNEL_LABELS[r.channel]}</span>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (r) => <CampaignStatusBadge status={r.status} />,
    },
    {
      id: "budget",
      header: "Ngân sách",
      sortable: true,
      cell: (r) => formatVnd(r.budget),
    },
    {
      id: "spent",
      header: "Đã chi",
      sortable: true,
      cell: (r) => (
        <span className={r.spent > r.budget ? "font-medium text-danger" : undefined}>
          {formatVnd(r.spent)}
        </span>
      ),
    },
    {
      id: "leadsCount",
      header: "Leads",
      sortable: true,
      cell: (r) => <span className="tabular-nums">{r.leadsCount}</span>,
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
      id: "actions",
      header: "Thao tác",
      sticky: "right",
      cell: (r) => (
        <RowActions
          onView={() => list.setViewId(r.id)}
          onEdit={() => list.setEditId(r.id)}
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
            icon={Megaphone}
            title="Không có chiến dịch"
            description="Thử đổi bộ lọc hoặc tạo chiến dịch mới."
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
