"use client";

import { useState, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Calendar, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

export interface DateRangeFilterProps {
  fromDate?: string;
  toDate?: string;
  onChange: (fromDate: string, toDate: string) => void;
  placeholder?: string;
  className?: string;
}

function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function DateRangeFilter({
  fromDate = "",
  toDate = "",
  onChange,
  placeholder = "Từ ngày - Đến ngày",
  className,
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [localFrom, setLocalFrom] = useState(fromDate);
  const [localTo, setLocalTo] = useState(toDate);

  useEffect(() => {
    setLocalFrom(fromDate);
    setLocalTo(toDate);
  }, [fromDate, toDate]);

  const hasFilter = Boolean(fromDate || toDate);

  const applyRange = (from: string, to: string) => {
    setLocalFrom(from);
    setLocalTo(to);
    onChange(from, to);
    setOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLocalFrom("");
    setLocalTo("");
    onChange("", "");
    setOpen(false);
  };

  const handleApply = () => {
    onChange(localFrom, localTo);
    setOpen(false);
  };

  // Quick presets
  const setPresetToday = () => {
    const today = toDateString(new Date());
    applyRange(today, today);
  };

  const setPresetLast7Days = () => {
    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - 6);
    applyRange(toDateString(past), toDateString(now));
  };

  const setPresetThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    applyRange(toDateString(firstDay), toDateString(now));
  };

  const setPresetLastMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    applyRange(toDateString(firstDay), toDateString(lastDay));
  };

  const renderLabel = () => {
    if (fromDate && toDate) {
      if (fromDate === toDate) {
        return formatDisplayDate(fromDate);
      }
      return `${formatDisplayDate(fromDate)} - ${formatDisplayDate(toDate)}`;
    }
    if (fromDate) {
      return `Từ ${formatDisplayDate(fromDate)}`;
    }
    if (toDate) {
      return `Đến ${formatDisplayDate(toDate)}`;
    }
    return placeholder;
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "group relative inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border bg-white px-2 text-xs text-foreground transition-colors hover:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300",
            hasFilter && "border-neutral-400 bg-neutral-50/50 font-medium",
            className,
          )}
          title="Lọc theo khoảng ngày"
        >
          <Calendar className="h-3.5 w-3.5 shrink-0 text-muted" />
          <span className={cn("truncate max-w-[170px]", !hasFilter && "text-muted font-normal")}>
            {renderLabel()}
          </span>
          {hasFilter ? (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleClear();
                }
              }}
              className="ml-0.5 -mr-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted hover:bg-neutral-200 hover:text-foreground cursor-pointer"
              title="Xóa bộ lọc ngày"
            >
              <X className="h-2.5 w-2.5" />
            </span>
          ) : null}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-[60] w-72 rounded-md border border-border bg-white p-3 shadow-lg text-xs"
        >
          <div className="flex items-center justify-between pb-2 border-b border-border mb-2.5 font-medium text-foreground">
            <span>Chọn khoảng thời gian</span>
            {hasFilter && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] text-muted hover:text-foreground hover:underline"
              >
                Xóa lọc
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              type="button"
              onClick={setPresetToday}
              className="rounded border border-border bg-surface px-2 py-1 text-[11px] text-foreground hover:bg-neutral-200 transition-colors"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={setPresetLast7Days}
              className="rounded border border-border bg-surface px-2 py-1 text-[11px] text-foreground hover:bg-neutral-200 transition-colors"
            >
              7 ngày qua
            </button>
            <button
              type="button"
              onClick={setPresetThisMonth}
              className="rounded border border-border bg-surface px-2 py-1 text-[11px] text-foreground hover:bg-neutral-200 transition-colors"
            >
              Tháng này
            </button>
            <button
              type="button"
              onClick={setPresetLastMonth}
              className="rounded border border-border bg-surface px-2 py-1 text-[11px] text-foreground hover:bg-neutral-200 transition-colors"
            >
              Tháng trước
            </button>
          </div>

          <div className="space-y-2 mb-3">
            <div>
              <label className="block text-[11px] text-muted mb-1">Từ ngày</label>
              <input
                type="date"
                value={localFrom}
                onChange={(e) => setLocalFrom(e.target.value)}
                className="h-7 w-full rounded border border-border bg-white px-2 text-xs outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300"
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted mb-1">Đến ngày</label>
              <input
                type="date"
                value={localTo}
                onChange={(e) => setLocalTo(e.target.value)}
                className="h-7 w-full rounded border border-border bg-white px-2 text-xs outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
            >
              Áp dụng
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
