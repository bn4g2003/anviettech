"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
};

export function Pagination({
  page,
  pageSize,
  total,
  pageSizeOptions = [20, 50, 100],
  onPageChange,
  onPageSizeChange,
  className,
}: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div
      className={cn(
        "flex h-[var(--footer-height)] shrink-0 items-center justify-between border-t border-border bg-white px-3 text-xs text-muted",
        className,
      )}
    >
      <div className="flex items-center gap-1">
        {pageSizeOptions.map((size) => (
          <Button
            key={size}
            size="sm"
            variant={pageSize === size ? "secondary" : "ghost"}
            className={cn(pageSize === size && "bg-muted-bg font-semibold")}
            onClick={() => onPageSizeChange(size)}
          >
            {size}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span>
          {from}–{to} / {total}
        </span>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Trước
          </Button>
          <span className="px-1">
            {page}/{totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
