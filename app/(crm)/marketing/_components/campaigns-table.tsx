"use client";

import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { Pagination } from "@/components/datagrid/pagination";
import { RowActions } from "@/components/datagrid/row-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { useMarketing } from "@/features/marketing/hooks/use-marketing";
import type { Campaign } from "@/features/marketing/types";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatDate, isDateInRange } from "@/features/shared/utils/date";
import { formatVnd } from "@/features/shared/utils/money";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { ExternalLink, Megaphone } from "lucide-react";
import { useMemo } from "react";
import {
  CAMPAIGN_CHANNEL_LABELS,
  CampaignStatusBadge,
} from "./campaign-status";

export function CampaignsTable() {
  const list = useListPage();
  const { canEdit } = useCurrentUser();
  const { rows, loading } = useMarketing({
    query: list.query,
    status: list.filters.status,
    channel: list.filters.channel,
  });

  const filtered = useMemo(() => {
    let result = rows;
    if (list.filters.fromDate || list.filters.toDate) {
      result = result.filter((r) =>
        isDateInRange(r.startDate || r.createdAt, list.filters.fromDate, list.filters.toDate),
      );
    }
    return result;
  }, [rows, list.filters.fromDate, list.filters.toDate]);

  const sorted = useMemo(() => {
    if (!list.sortKey) return filtered;
    const dir = list.sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const key = list.sortKey as keyof Campaign;
      const av = a[key];
      const bv = b[key];
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }
      return String(av ?? "").localeCompare(String(bv ?? ""), "vi") * dir;
    });
  }, [filtered, list.sortKey, list.sortDir]);

  const pageRows = list.paginate(sorted);

  const allColumns: DataGridColumn<Campaign>[] = [
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
      id: "name",
      header: "Tên chiến dịch",
      sortable: true,
      cell: (r) => (
        <span
          className="font-semibold text-foreground text-xs truncate max-w-[220px] block whitespace-nowrap hover:underline cursor-pointer"
          title={r.name}
          onClick={(e) => {
            e.stopPropagation();
            list.setViewId(r.id);
          }}
        >
          {r.name}
        </span>
      ),
    },
    {
      id: "channel",
      header: "Kênh",
      cell: (r) => (
        <span className="text-muted text-xs whitespace-nowrap">{CAMPAIGN_CHANNEL_LABELS[r.channel]}</span>
      ),
    },
    {
      id: "landingPageUrl",
      header: "Link quảng cáo",
      cell: (r) =>
        r.landingPageUrl ? (
          <a
            href={r.landingPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline text-xs whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
            title={r.landingPageUrl}
          >
            <ExternalLink className="h-3 w-3" />
            <span>Mở link</span>
          </a>
        ) : (
          <span className="text-muted text-xs">—</span>
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
      cell: (r) => <span className="font-mono text-xs font-semibold text-foreground whitespace-nowrap">{formatVnd(r.budget)}</span>,
    },
    {
      id: "spent",
      header: "Đã chi",
      sortable: true,
      cell: (r) => (
        <span className={`font-mono text-xs whitespace-nowrap ${r.spent > r.budget ? "font-semibold text-danger" : "text-muted"}`}>
          {formatVnd(r.spent)}
        </span>
      ),
    },
    {
      id: "leadsCount",
      header: "Leads",
      sortable: true,
      cell: (r) => <span className="font-mono text-xs tabular-nums whitespace-nowrap">{r.leadsCount}</span>,
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
      id: "actions",
      header: "Thao tác",
      sticky: "right",
      cell: (r) => (
        <RowActions
          onView={() => list.setViewId(r.id)}
          onEdit={canEdit("campaigns", r.owner?.id) ? () => list.setEditId(r.id) : undefined}
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
