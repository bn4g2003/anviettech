"use client";

import { useId, useState } from "react";
import { formatVnd } from "@/features/shared/utils/money";
import { FileSpreadsheet, Printer, ChevronDown, ChevronUp, Layers } from "lucide-react";

export type MatrixRow = {
  id: string;
  code: string;
  name: string;
  isHeader?: boolean;
  isSummary?: boolean;
  indent?: boolean;
  months: number[];
  quarters: number[];
  ytd: number;
};

interface FinancialMatrixTableProps {
  year: number;
  rows: MatrixRow[];
  onYearChange?: (year: number) => void;
  availableYears?: number[];
}

export function FinancialMatrixTable({
  year,
  rows,
  onYearChange,
  availableYears = [2025, 2026],
}: FinancialMatrixTableProps) {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const selectId = useId();

  const toggleSection = (code: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const exportToCsv = () => {
    const headers = [
      "Mã",
      "Khoản mục",
      "Tháng 1",
      "Tháng 2",
      "Tháng 3",
      "Tháng 4",
      "Tháng 5",
      "Tháng 6",
      "Tháng 7",
      "Tháng 8",
      "Tháng 9",
      "Tháng 10",
      "Tháng 11",
      "Tháng 12",
      "Lũy kế cuối quý",
    ];

    const csvRows = [
      headers.join(","),
      ...rows.map((r) =>
        [
          `"${r.code}"`,
          `"${r.name}"`,
          ...r.months.map((val) => val),
          r.ytd,
        ].join(",")
      ),
    ];

    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Bao_Cao_Phan_Tich_Tai_Chinh_${year}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="rounded-md border border-border bg-white shadow-2xs">
      {/* Header controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Bảng Báo Cáo Phân Tích HĐKD (Năm {year})
            </h2>
            <p className="text-xs text-muted">
              Số liệu tổng hợp theo Tháng, Quý và Lũy kế cả năm theo định mẫu quản trị
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onYearChange && (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <label htmlFor={selectId} className="font-medium">Năm báo cáo:</label>
              <select
                id={selectId}
                value={year}
                onChange={(e) => onYearChange(Number(e.target.value))}
                className="rounded-md border border-border bg-white px-2 py-1 text-xs font-semibold text-foreground shadow-2xs focus:border-primary focus:outline-none"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    Năm {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={exportToCsv}
            className="flex items-center gap-1.5 rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-foreground hover:bg-neutral-100 transition-colors"
            title="Xuất file CSV"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-muted" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-foreground hover:bg-neutral-100 transition-colors"
            title="In báo cáo"
          >
            <Printer className="h-3.5 w-3.5 text-muted" />
            <span>In Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* Responsive Matrix Table */}
      <div className="relative overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            {/* Top Row: Quarter Groupings */}
            <tr className="border-b border-border bg-neutral-100 text-foreground font-semibold">
              <th scope="col" rowSpan={2} className="sticky left-0 z-20 min-w-[240px] bg-neutral-100 px-4 py-2.5 shadow-[1px_0_3px_rgba(0,0,0,0.08)]">
                Khoản mục
              </th>
              <th scope="col" colSpan={3} className="border-l border-border px-2 py-1 text-center bg-neutral-50 text-foreground font-semibold">
                Quý I
              </th>
              <th scope="col" colSpan={3} className="border-l border-border px-2 py-1 text-center bg-neutral-50 text-foreground font-semibold">
                Quý II
              </th>
              <th scope="col" colSpan={3} className="border-l border-border px-2 py-1 text-center bg-neutral-50 text-foreground font-semibold">
                Quý III
              </th>
              <th scope="col" colSpan={3} className="border-l border-border px-2 py-1 text-center bg-neutral-50 text-foreground font-semibold">
                Quý IV
              </th>
              <th scope="col" rowSpan={2} className="border-l-2 border-border px-3 py-2.5 text-right font-bold text-foreground bg-neutral-200/80 min-w-[140px]">
                Lũy kế cuối quý
              </th>
            </tr>

            {/* Second Row: Monthly Header */}
            <tr className="border-b border-border bg-neutral-50 font-medium text-muted text-center">
              <th scope="col" className="border-l border-border px-2 py-1.5 min-w-[95px]">Tháng 1</th>
              <th scope="col" className="border-l border-border px-2 py-1.5 min-w-[95px]">Tháng 2</th>
              <th scope="col" className="border-l border-border px-2 py-1.5 min-w-[95px] font-semibold text-foreground bg-neutral-100/60">Tháng 3</th>
              <th scope="col" className="border-l border-border px-2 py-1.5 min-w-[95px]">Tháng 4</th>
              <th scope="col" className="border-l border-border px-2 py-1.5 min-w-[95px]">Tháng 5</th>
              <th scope="col" className="border-l border-border px-2 py-1.5 min-w-[95px] font-semibold text-foreground bg-neutral-100/60">Tháng 6</th>
              <th scope="col" className="border-l border-border px-2 py-1.5 min-w-[95px]">Tháng 7</th>
              <th scope="col" className="border-l border-border px-2 py-1.5 min-w-[95px]">Tháng 8</th>
              <th scope="col" className="border-l border-border px-2 py-1.5 min-w-[95px] font-semibold text-foreground bg-neutral-100/60">Tháng 9</th>
              <th scope="col" className="border-l border-border px-2 py-1.5 min-w-[95px]">Tháng 10</th>
              <th scope="col" className="border-l border-border px-2 py-1.5 min-w-[95px]">Tháng 11</th>
              <th scope="col" className="border-l border-border px-2 py-1.5 min-w-[95px] font-semibold text-foreground bg-neutral-100/60">Tháng 12</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {rows.map((row) => {
              const parentCode = row.code.split(".")[0];
              const isCollapsed = collapsedSections[parentCode] && !row.isHeader;

              if (isCollapsed) return null;

              let rowClass = "hover:bg-neutral-50 transition-colors";
              let stickyClass = "bg-white";

              if (row.isHeader && !row.isSummary) {
                rowClass = "bg-neutral-100/70 font-semibold text-foreground";
                stickyClass = "bg-neutral-100/90";
              } else if (row.isHeader && row.isSummary) {
                if (row.code === "3") {
                  rowClass = "bg-emerald-50/60 font-bold text-foreground";
                  stickyClass = "bg-emerald-50/80";
                } else if (row.code === "5") {
                  rowClass = "bg-neutral-200/60 font-bold text-foreground text-xs";
                  stickyClass = "bg-neutral-200/90";
                }
              }

              return (
                <tr key={row.id} className={rowClass}>
                  {/* Sticky Column 1: Khoản mục */}
                  <td className={`sticky left-0 z-10 px-4 py-2 shadow-[1px_0_3px_rgba(0,0,0,0.05)] ${stickyClass}`}>
                    <div className="flex items-center gap-1">
                      {row.isHeader && (
                        <button
                          type="button"
                          onClick={() => toggleSection(row.code)}
                          className="rounded p-0.5 text-muted hover:bg-neutral-200"
                        >
                          {collapsedSections[row.code] ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                      <span className={row.indent ? "pl-4 text-foreground font-normal" : "font-semibold text-foreground"}>
                        {row.name}
                      </span>
                    </div>
                  </td>

                  {/* 12 Months Columns */}
                  {row.months.map((val, idx) => {
                    const isQuarterEnd = idx === 2 || idx === 5 || idx === 8 || idx === 11;
                    const valColor = val < 0 ? "text-danger" : "text-foreground";

                    return (
                      <td
                        key={idx}
                        className={`border-l border-border px-2 py-2 text-right ${valColor} ${
                          isQuarterEnd ? "font-medium bg-neutral-50/50" : ""
                        }`}
                      >
                        {formatVnd(val)}
                      </td>
                    );
                  })}

                  {/* YTD Total Column */}
                  <td className="border-l-2 border-border px-3 py-2 text-right font-bold text-foreground bg-neutral-100/50">
                    {formatVnd(row.ytd)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer sign-off matching phan-tich.md signature format */}
      <div className="flex flex-wrap items-center justify-between border-t border-border px-4 py-3 text-xs text-muted bg-white">
        <div>
          <span>CRM An Việt Tech &bull; Báo cáo Phân tích HĐKD</span>
        </div>
        <div className="text-right">
          <p className="italic">Ngày 5 tháng 10 năm 2025</p>
          <p className="font-semibold text-foreground mt-0.5">Người lập biểu: Nguyễn Phương Mai</p>
        </div>
      </div>
    </div>
  );
}
