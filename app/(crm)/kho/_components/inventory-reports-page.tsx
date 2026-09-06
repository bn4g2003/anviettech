"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Download, RefreshCw, Search } from "lucide-react";
import { AppHeader } from "@/components/shell/app-header";
import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { Pagination } from "@/components/datagrid/pagination";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";

type ReportKind = "stock" | "moves" | "projects" | "warranty";
type ReportRow = Record<string, string | number | null> & { id: string };

const REPORTS: { value: ReportKind; label: string; description: string }[] = [
  { value: "stock", label: "Nhập - Xuất - Tồn", description: "Tồn thực tế theo hàng hóa và kho." },
  { value: "moves", label: "Lịch sử nhập - xuất", description: "Các phiếu kho, trạng thái và đối tượng liên quan." },
  { value: "projects", label: "Xuất công trình", description: "Hàng đã xuất lắp đặt theo công trình và khách hàng." },
  { value: "warranty", label: "Hàng lỗi / bảo hành", description: "Serial đang bảo hành hoặc hư hỏng." },
];

const LABELS: Record<string, string> = {
  sku: "Mã hàng",
  name: "Hàng hóa",
  itemType: "Loại",
  warehouseCode: "Kho",
  qty: "Tồn hiện tại",
  minStock: "Tồn tối thiểu",
  receivedQty: "Nhập trong kỳ",
  issuedQty: "Xuất trong kỳ",
  code: "Mã phiếu",
  type: "Loại phiếu",
  reason: "Nghiệp vụ",
  status: "Trạng thái",
  createdAt: "Ngày tạo",
  supplierName: "Nhà cung cấp",
  customerName: "Khách hàng",
  projectName: "Công trình",
  issuedAt: "Ngày xuất",
  projectCode: "Mã công trình",
  productName: "Sản phẩm",
  serial: "Serial",
  warrantyUntil: "Hết bảo hành",
};

const NUMERIC_COLUMNS = new Set(["qty", "minStock", "receivedQty", "issuedQty"]);

function cell(value: ReportRow[string]) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return value.toLocaleString("vi-VN");
  return String(value);
}

export function InventoryReportsPage() {
  const { toast } = useToast();
  const [kind, setKind] = useState<ReportKind>("stock");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortKey, setSortKey] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const current = useMemo(() => REPORTS.find((report) => report.value === kind)!, [kind]);

  const reload = useCallback(
    async (reportKind = kind) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ kind: reportKind });
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        const result = await apiFetch<Record<string, string | number | null>[]>(
          `/api/v1/inventory/reports?${params}`,
        );
        const raw = result.data ?? [];
        const withIds: ReportRow[] = raw.map((row, index) => ({
          ...row,
          id: String(row.id ?? row.code ?? row.serial ?? row.sku ?? `row-${index}`),
        }));
        setRows(withIds);
      } catch (error) {
        setRows([]);
        toast(error instanceof Error ? error.message : "Không thể tải báo cáo", "error");
      } finally {
        setLoading(false);
      }
    },
    [from, kind, to, toast],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  function switchReport(value: string) {
    setKind(value as ReportKind);
    setSearchQuery("");
    setSortKey("");
    setPage(1);
  }

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filteredRows = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      Object.values(row).some(
        (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(term),
      ),
    );
  }, [rows, searchQuery]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;
    const dir = sortDir === "asc" ? 1 : -1;
    const isNum = NUMERIC_COLUMNS.has(sortKey);
    return [...filteredRows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (isNum) {
        return (Number(av ?? 0) - Number(bv ?? 0)) * dir;
      }
      return String(av ?? "").localeCompare(String(bv ?? ""), "vi") * dir;
    });
  }, [filteredRows, sortKey, sortDir]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  const rawColumns = useMemo(
    () => (rows.length ? Object.keys(rows[0]).filter((k) => k !== "id") : []),
    [rows],
  );

  const columns: DataGridColumn<ReportRow>[] = useMemo(() => {
    return rawColumns.map((colKey) => {
      const isNum = NUMERIC_COLUMNS.has(colKey);
      return {
        id: colKey,
        header: LABELS[colKey] ?? colKey,
        sortable: true,
        cell: (r) => {
          const val = r[colKey];
          if (val === null || val === undefined || val === "") {
            return <span className="text-muted">—</span>;
          }
          if (isNum) {
            return (
              <div className="text-right font-mono font-medium">
                {Number(val).toLocaleString("vi-VN")}
              </div>
            );
          }
          if (colKey === "sku" || colKey === "code" || colKey === "serial") {
            return <span className="font-mono text-xs font-semibold">{String(val)}</span>;
          }
          return <span>{String(val)}</span>;
        },
      };
    });
  }, [rawColumns]);

  function exportCsv() {
    if (!rows.length) return;
    const keys = rawColumns;
    const headers = keys.map((k) => LABELS[k] ?? k);
    const dataLines = filteredRows.map((r) =>
      keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","),
    );
    const csvContent = "\uFEFF" + [headers.join(","), ...dataLines].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bao-cao-kho-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader moduleLabel="Báo cáo kho" />

      {/* Modern Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border bg-white px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            className="h-8 text-xs font-medium"
            value={kind}
            onChange={(event) => switchReport(event.target.value)}
          >
            {REPORTS.map((report) => (
              <option key={report.value} value={report.value}>
                {report.label}
              </option>
            ))}
          </Select>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <Input
              type="search"
              placeholder="Tìm kiếm dòng..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="h-8 w-44 pl-8 text-xs"
            />
          </div>

          <label className="flex items-center gap-1.5 text-xs text-muted">
            <span>Từ:</span>
            <Input
              className="h-8 w-36 text-xs"
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>

          <label className="flex items-center gap-1.5 text-xs text-muted">
            <span>Đến:</span>
            <Input
              className="h-8 w-36 text-xs"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>

          <span className="hidden xl:inline text-xs text-muted">
            {current.description}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void reload()}
            disabled={loading}
            className="h-8 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={!rows.length || loading}
            className="h-8 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Xuất CSV</span>
          </Button>
        </div>
      </div>

      {/* Edge-to-Edge DataGrid */}
      <div className="flex-1 min-h-0">
        <DataGrid
          columns={columns}
          rows={pageRows}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={toggleSort}
          loading={loading}
          empty={
            <EmptyState
              icon={BarChart3}
              title="Chưa có dữ liệu báo cáo"
              description="Báo cáo sẽ hiển thị khi có dữ liệu nghiệp vụ phù hợp hoặc thử đổi bộ lọc ngày."
            />
          }
        />
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        pageSize={pageSize}
        total={sortedRows.length}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
      />
    </div>
  );
}
