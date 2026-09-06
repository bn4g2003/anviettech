"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Download,
  RefreshCw,
  Search,
  Building2,
  User,
  FolderKanban,
  FileSpreadsheet,
} from "lucide-react";
import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { Pagination } from "@/components/datagrid/pagination";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatVnd } from "@/features/shared/utils/money";
import { loadOwners } from "@/features/shared/api/owners";
import { apiFetch, toQuery } from "@/lib/api-client";

type Ref = { id: string; name: string };

type ReportSummary = {
  grossRevenue: number;
  reductions: number;
  netRevenue: number;
  cogs: number;
  laborCost: number;
  otherExpenses: number;
  profit: number;
  receivable: number;
};

type CustomerReportRow = {
  id: string;
  customerId: string;
  customerName?: string;
  revenue: number;
  cogs: number;
  paid: number;
  receivable: number;
};

type Report = {
  summary: ReportSummary;
  customers: CustomerReportRow[];
};

const today = new Date().toISOString().slice(0, 10);

export function FinanceReportsPanel() {
  const [filters, setFilters] = useState({
    from: today.slice(0, 4) + "-01-01",
    to: today,
    customerId: "",
    employeeId: "",
    projectId: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Ref[]>([]);
  const [employees, setEmployees] = useState<Ref[]>([]);
  const [projects, setProjects] = useState<Ref[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  // Pagination & Sorting state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortKey, setSortKey] = useState<string>("revenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [result, cs, us, ps] = await Promise.all([
        apiFetch<Report>(`/api/v1/finance/reports${toQuery(filters)}`),
        apiFetch<Ref[]>(`/api/v1/customers${toQuery({ pageSize: 1000, status: "active" })}`),
        loadOwners(),
        apiFetch<Ref[]>(`/api/v1/projects${toQuery({ pageSize: 1000 })}`),
      ]);
      const data = result.data;
      if (data) {
        setReport({
          summary: data.summary,
          customers: (data.customers ?? []).map((c) => ({
            ...c,
            id: c.customerId,
          })),
        });
      } else {
        setReport(null);
      }
      setCustomers(cs.data ?? []);
      setEmployees(us);
      setProjects(ps.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  function exportCsv() {
    if (!report) return;
    const lines = [
      ["Chỉ tiêu", "Số tiền"],
      ["Doanh thu gộp", report.summary.grossRevenue],
      ["Giảm trừ", report.summary.reductions],
      ["Doanh thu thuần", report.summary.netRevenue],
      ["Giá vốn", report.summary.cogs],
      ["Chi phí nhân công", report.summary.laborCost],
      ["Chi phí khác", report.summary.otherExpenses],
      ["Lợi nhuận tạm tính", report.summary.profit],
      ["Công nợ", report.summary.receivable],
      [],
      ["Khách hàng", "Doanh thu", "Giá vốn", "Đã thu", "Công nợ"],
      ...report.customers.map((c) => [
        `"${c.customerName ?? customers.find((item) => item.id === c.customerId)?.name ?? "Khách hàng"}"`,
        c.revenue,
        c.cogs,
        c.paid,
        c.receivable,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\uFEFF" + lines], { type: "text/csv;charset=utf-8" }));
    link.download = `bao-cao-tai-chinh-${today}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const s = report?.summary;

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!report?.customers) return [];
    const term = searchQuery.trim().toLowerCase();
    return report.customers.filter((c) => {
      const name = c.customerName ?? customers.find((item) => item.id === c.customerId)?.name ?? "";
      if (!term) return true;
      return name.toLowerCase().includes(term);
    });
  }, [report?.customers, searchQuery, customers]);

  const sortedCustomers = useMemo(() => {
    if (!sortKey) return filteredCustomers;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredCustomers].sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "customer") {
        av = a.customerName ?? customers.find((item) => item.id === a.customerId)?.name ?? "";
        bv = b.customerName ?? customers.find((item) => item.id === b.customerId)?.name ?? "";
        return String(av).localeCompare(String(bv), "vi") * dir;
      }
      av = (a as unknown as Record<string, number>)[sortKey] ?? 0;
      bv = (b as unknown as Record<string, number>)[sortKey] ?? 0;
      return (av - bv) * dir;
    });
  }, [filteredCustomers, sortKey, sortDir, customers]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedCustomers.slice(start, start + pageSize);
  }, [sortedCustomers, page, pageSize]);

  const columns: DataGridColumn<CustomerReportRow>[] = [
    {
      id: "customer",
      header: "Khách hàng",
      sortable: true,
      cell: (r) => {
        const name = r.customerName ?? customers.find((c) => c.id === r.customerId)?.name ?? "Khách hàng";
        return (
          <Link
            href={`/khach-hang/${r.customerId}`}
            className="font-medium text-foreground hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {name}
          </Link>
        );
      },
    },
    {
      id: "revenue",
      header: "Doanh thu",
      sortable: true,
      cell: (r) => (
        <div className="text-right font-mono font-medium">{formatVnd(r.revenue)}</div>
      ),
    },
    {
      id: "cogs",
      header: "Giá vốn",
      sortable: true,
      cell: (r) => (
        <div className="text-right font-mono text-muted">{formatVnd(r.cogs)}</div>
      ),
    },
    {
      id: "paid",
      header: "Đã thu",
      sortable: true,
      cell: (r) => (
        <div className="text-right font-mono font-medium text-emerald-600">
          {formatVnd(r.paid)}
        </div>
      ),
    },
    {
      id: "receivable",
      header: "Công nợ còn lại",
      sortable: true,
      cell: (r) => (
        <div
          className={`text-right font-mono font-medium ${
            r.receivable > 0 ? "text-danger" : "text-muted"
          }`}
        >
          {formatVnd(r.receivable)}
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Sleek Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-white px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <Input
              type="search"
              placeholder="Tìm khách hàng..."
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
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((x) => ({ ...x, from: e.target.value }))}
              className="h-8 w-36 text-xs"
            />
          </label>

          <label className="flex items-center gap-1.5 text-xs text-muted">
            <span>Đến:</span>
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((x) => ({ ...x, to: e.target.value }))}
              className="h-8 w-36 text-xs"
            />
          </label>

          <Select
            className="h-8 w-36 max-w-[150px] truncate text-xs"
            value={filters.customerId}
            onChange={(e) => setFilters((x) => ({ ...x, customerId: e.target.value }))}
          >
            <option value="">Khách hàng</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Select
            className="h-8 w-32 text-xs"
            value={filters.employeeId}
            onChange={(e) => setFilters((x) => ({ ...x, employeeId: e.target.value }))}
          >
            <option value="">Nhân viên</option>
            {employees.map((em) => (
              <option key={em.id} value={em.id}>
                {em.name}
              </option>
            ))}
          </Select>

          <Select
            className="h-8 w-32 text-xs"
            value={filters.projectId}
            onChange={(e) => setFilters((x) => ({ ...x, projectId: e.target.value }))}
          >
            <option value="">Công trình</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
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
            disabled={!s || loading}
            className="h-8 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Xuất CSV</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      {s && (
        <div className="grid grid-cols-2 gap-2 border-b border-border bg-neutral-50/70 p-3 sm:grid-cols-4 lg:grid-cols-8">
          {[
            { label: "Doanh thu gộp", value: s.grossRevenue, color: "text-foreground" },
            { label: "Giảm trừ", value: s.reductions, color: "text-amber-600" },
            { label: "Doanh thu thuần", value: s.netRevenue, color: "text-foreground font-bold" },
            { label: "Giá vốn (COGS)", value: s.cogs, color: "text-muted" },
            { label: "Chi phí nhân công", value: s.laborCost, color: "text-muted" },
            { label: "Chi phí khác", value: s.otherExpenses, color: "text-muted" },
            {
              label: "Lợi nhuận tạm tính",
              value: s.profit,
              color: s.profit >= 0 ? "text-emerald-600 font-bold" : "text-danger font-bold",
            },
            {
              label: "Công nợ cần thu",
              value: s.receivable,
              color: s.receivable > 0 ? "text-danger font-bold" : "text-muted",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded border border-border bg-white px-2.5 py-1.5 shadow-2xs"
            >
              <p className="text-[11px] font-medium text-muted truncate" title={item.label}>
                {item.label}
              </p>
              <p className={`mt-0.5 font-mono text-sm tracking-tight ${item.color}`}>
                {formatVnd(item.value)}
              </p>
            </div>
          ))}
        </div>
      )}

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
              icon={FileSpreadsheet}
              title="Chưa có dữ liệu báo cáo"
              description="Không tìm thấy giao dịch nào phù hợp với phạm vi thời gian hoặc bộ lọc đã chọn."
            />
          }
        />
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        pageSize={pageSize}
        total={sortedCustomers.length}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
      />
    </div>
  );
}
