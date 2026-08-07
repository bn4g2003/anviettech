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
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Bảng Báo Cáo Phân Tích HĐKD (Năm {year})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Số liệu tổng hợp theo Tháng, Quý và Lũy kế cả năm
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onYearChange && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <label htmlFor={selectId} className="font-medium">Năm báo cáo:</label>
              <select
                id={selectId}
                value={year}
                onChange={(e) => onYearChange(Number(e.target.value))}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            title="Xuất file CSV"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            title="In báo cáo"
          >
            <Printer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>In Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* Responsive Matrix Table Container */}
      <div className="relative overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Header */}
          <thead>
            {/* Top Row: Quarter Groupings */}
            <tr className="border-b border-slate-200 bg-slate-100/80 font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
              <th scope="col" rowSpan={2} className="sticky left-0 z-20 min-w-[240px] bg-slate-100 px-4 py-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:bg-slate-800">
                Khoản mục
              </th>
              <th scope="col" colSpan={3} className="border-l border-slate-200 px-2 py-1.5 text-center bg-blue-50/50 text-blue-900 dark:border-slate-700 dark:bg-blue-950/30 dark:text-blue-200">
                Quý I
              </th>
              <th scope="col" colSpan={3} className="border-l border-slate-200 px-2 py-1.5 text-center bg-emerald-50/50 text-emerald-900 dark:border-slate-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                Quý II
              </th>
              <th scope="col" colSpan={3} className="border-l border-slate-200 px-2 py-1.5 text-center bg-amber-50/50 text-amber-900 dark:border-slate-700 dark:bg-amber-950/30 dark:text-amber-200">
                Quý III
              </th>
              <th scope="col" colSpan={3} className="border-l border-slate-200 px-2 py-1.5 text-center bg-purple-50/50 text-purple-900 dark:border-slate-700 dark:bg-purple-950/30 dark:text-purple-200">
                Quý IV
              </th>
              <th scope="col" rowSpan={2} className="border-l-2 border-slate-300 px-4 py-3 text-right font-bold text-slate-900 bg-slate-200/80 dark:border-slate-700 dark:bg-slate-700 dark:text-white min-w-[140px]">
                Lũy kế cuối quý
              </th>
            </tr>

            {/* Second Row: Monthly Header */}
            <tr className="border-b border-slate-200 bg-slate-50 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400 text-center">
              <th scope="col" className="border-l border-slate-200 px-2 py-2 min-w-[100px] dark:border-slate-800">Tháng 1</th>
              <th scope="col" className="border-l border-slate-200 px-2 py-2 min-w-[100px] dark:border-slate-800">Tháng 2</th>
              <th scope="col" className="border-l border-slate-200 px-2 py-2 min-w-[100px] dark:border-slate-800 font-semibold bg-blue-50/30 dark:bg-blue-950/20">Tháng 3</th>
              <th scope="col" className="border-l border-slate-200 px-2 py-2 min-w-[100px] dark:border-slate-800">Tháng 4</th>
              <th scope="col" className="border-l border-slate-200 px-2 py-2 min-w-[100px] dark:border-slate-800">Tháng 5</th>
              <th scope="col" className="border-l border-slate-200 px-2 py-2 min-w-[100px] dark:border-slate-800 font-semibold bg-emerald-50/30 dark:bg-emerald-950/20">Tháng 6</th>
              <th scope="col" className="border-l border-slate-200 px-2 py-2 min-w-[100px] dark:border-slate-800">Tháng 7</th>
              <th scope="col" className="border-l border-slate-200 px-2 py-2 min-w-[100px] dark:border-slate-800">Tháng 8</th>
              <th scope="col" className="border-l border-slate-200 px-2 py-2 min-w-[100px] dark:border-slate-800 font-semibold bg-amber-50/30 dark:bg-amber-950/20">Tháng 9</th>
              <th scope="col" className="border-l border-slate-200 px-2 py-2 min-w-[100px] dark:border-slate-800">Tháng 10</th>
              <th scope="col" className="border-l border-slate-200 px-2 py-2 min-w-[100px] dark:border-slate-800">Tháng 11</th>
              <th scope="col" className="border-l border-slate-200 px-2 py-2 min-w-[100px] dark:border-slate-800 font-semibold bg-purple-50/30 dark:bg-purple-950/20">Tháng 12</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row) => {
              const parentCode = row.code.split(".")[0];
              const isCollapsed = collapsedSections[parentCode] && !row.isHeader;

              if (isCollapsed) return null;

              let rowClass = "hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/40";
              let stickyClass = "bg-white dark:bg-slate-900";

              if (row.isHeader && !row.isSummary) {
                rowClass = "bg-slate-50/90 font-bold text-slate-900 dark:bg-slate-800/80 dark:text-white";
                stickyClass = "bg-slate-50 dark:bg-slate-800";
              } else if (row.isHeader && row.isSummary) {
                if (row.code === "3") {
                  rowClass = "bg-emerald-50/90 font-bold text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-100";
                  stickyClass = "bg-emerald-50 dark:bg-emerald-950/50";
                } else if (row.code === "5") {
                  rowClass = "bg-blue-100/80 font-extrabold text-blue-950 dark:bg-blue-950/70 dark:text-blue-100 text-sm";
                  stickyClass = "bg-blue-100 dark:bg-blue-950";
                }
              }

              return (
                <tr key={row.id} className={rowClass}>
                  {/* Sticky Column 1: Khoản mục */}
                  <td className={`sticky left-0 z-10 px-4 py-2.5 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] ${stickyClass}`}>
                    <div className="flex items-center gap-1.5">
                      {row.isHeader && (
                        <button
                          type="button"
                          onClick={() => toggleSection(row.code)}
                          className="rounded p-0.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          {collapsedSections[row.code] ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                      <span className={row.indent ? "pl-5 font-normal text-slate-700 dark:text-slate-300" : "font-semibold"}>
                        {row.name}
                      </span>
                    </div>
                  </td>

                  {/* 12 Months Columns */}
                  {row.months.map((val, idx) => {
                    const isQuarterEnd = idx === 2 || idx === 5 || idx === 8 || idx === 11;
                    const valColor = val < 0 ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-200";

                    return (
                      <td
                        key={idx}
                        className={`border-l border-slate-200 px-2 py-2 text-right dark:border-slate-800/80 ${valColor} ${
                          isQuarterEnd ? "font-medium bg-slate-50/50 dark:bg-slate-800/30" : ""
                        }`}
                      >
                        {formatVnd(val)}
                      </td>
                    );
                  })}

                  {/* YTD Total Column */}
                  <td className="border-l-2 border-slate-300 px-4 py-2.5 text-right font-bold text-slate-900 bg-slate-100/50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white">
                    {formatVnd(row.ytd)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer sign-off matching phan-tich.md signature format */}
      <div className="flex flex-wrap items-center justify-between border-t border-slate-200 px-6 py-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <div>
          <span>CRM An Việt Tech &bull; Báo cáo Tổng hợp Quản trị HĐKD</span>
        </div>
        <div className="text-right">
          <p className="italic">Ngày 5 tháng 10 năm 2025</p>
          <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">Người lập biểu: Nguyễn Phương Mai</p>
        </div>
      </div>
    </div>
  );
}
