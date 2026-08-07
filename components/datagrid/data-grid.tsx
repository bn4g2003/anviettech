"use client";

import { cn } from "@/lib/cn";
import { ReactNode } from "react";

export type DataGridColumn<T> = {
  id: string;
  header: string;
  width?: string;
  sticky?: "left" | "right";
  sortable?: boolean;
  cell: (row: T) => ReactNode;
};

type DataGridProps<T extends { id: string }> = {
  columns: DataGridColumn<T>[];
  rows: T[];
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  onRowClick?: (row: T) => void;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  empty?: ReactNode;
  loading?: boolean;
  className?: string;
};

export function DataGrid<T extends { id: string }>({
  columns,
  rows,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onRowClick,
  sortKey,
  sortDir,
  onSort,
  empty,
  loading = false,
  className,
}: DataGridProps<T>) {
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(r.id));
  const colSpan = columns.length + (onToggleSelect ? 1 : 0);

  return (
    <div className={cn("min-h-0 flex-1 overflow-auto border-t border-border bg-white", className)}>
      <table className="w-full min-w-[960px] border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10 bg-surface">
          <tr className="border-b border-border">
            {onToggleSelect ? (
              <th className="w-9 px-2 py-1.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Chọn tất cả"
                  className="rounded border-border"
                  disabled={loading}
                />
              </th>
            ) : null}
            {columns.map((col) => (
              <th
                key={col.id}
                className={cn(
                  "px-2 py-1.5 text-xs font-medium text-muted whitespace-nowrap",
                  col.width,
                  col.sticky === "right" && "sticky right-0 bg-surface shadow-[-4px_0_8px_rgba(0,0,0,0.04)]",
                )}
              >
                {col.sortable && onSort ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => onSort(col.id)}
                  >
                    {col.header}
                    {sortKey === col.id ? (sortDir === "asc" ? " ↑" : " ↓") : null}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colSpan} className="px-2 py-10 text-center text-sm text-muted">
                Đang tải dữ liệu...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="p-0">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border hover:bg-surface/80"
                onClick={() => onRowClick?.(row)}
              >
                {onToggleSelect ? (
                  <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => onToggleSelect(row.id)}
                      aria-label="Chọn dòng"
                      className="rounded border-border"
                    />
                  </td>
                ) : null}
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={cn(
                      "px-2 py-1.5 align-middle",
                      col.sticky === "right" &&
                        "sticky right-0 bg-white shadow-[-4px_0_8px_rgba(0,0,0,0.04)]",
                    )}
                    onClick={
                      col.sticky === "right" ? (e) => e.stopPropagation() : undefined
                    }
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
