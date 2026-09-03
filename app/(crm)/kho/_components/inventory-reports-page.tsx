"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { AppHeader } from "@/components/shell/app-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";

type ReportKind = "stock" | "moves" | "projects" | "warranty";
type ReportRow = Record<string, string | number | null>;

const REPORTS: { value: ReportKind; label: string; description: string }[] = [
  { value: "stock", label: "Nhập - Xuất - Tồn", description: "Tồn thực tế theo hàng hóa và kho." },
  { value: "moves", label: "Lịch sử nhập - xuất", description: "Các phiếu kho, trạng thái và đối tượng liên quan." },
  { value: "projects", label: "Xuất công trình", description: "Hàng đã xuất lắp đặt theo công trình và khách hàng." },
  { value: "warranty", label: "Hàng lỗi / bảo hành", description: "Serial đang bảo hành hoặc hư hỏng." },
];

const LABELS: Record<string, string> = {
  sku: "Mã hàng", name: "Hàng hóa", itemType: "Loại", warehouseCode: "Kho", qty: "Tồn hiện tại", minStock: "Tồn tối thiểu", receivedQty: "Nhập trong kỳ", issuedQty: "Xuất trong kỳ",
  code: "Mã phiếu", type: "Loại phiếu", reason: "Nghiệp vụ", status: "Trạng thái", createdAt: "Ngày tạo", supplierName: "Nhà cung cấp", customerName: "Khách hàng", projectName: "Công trình",
  issuedAt: "Ngày xuất", projectCode: "Mã công trình", productName: "Sản phẩm", serial: "Serial", warrantyUntil: "Hết bảo hành",
};

function cell(value: ReportRow[string]) {
  if (value === null || value === "") return "—";
  return String(value);
}

export function InventoryReportsPage() {
  const { toast } = useToast();
  const [kind, setKind] = useState<ReportKind>("stock");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const current = useMemo(() => REPORTS.find((report) => report.value === kind)!, [kind]);
  const reload = useCallback(async (reportKind = kind) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ kind: reportKind });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const result = await apiFetch<ReportRow[]>(`/api/v1/inventory/reports?${params}`);
      setRows(result.data ?? []);
    } catch (error) {
      setRows([]);
      toast(error instanceof Error ? error.message : "Không thể tải báo cáo", "error");
    } finally { setLoading(false); }
  }, [from, kind, to, toast]);
  useEffect(() => { void reload(); }, [reload]);
  const columns = useMemo(() => rows.length ? Object.keys(rows[0]) : [], [rows]);
  function switchReport(value: string) { setKind(value as ReportKind); }
  return <div className="flex h-full min-h-0 flex-col">
    <AppHeader moduleLabel="Báo cáo kho" />
    <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3"><div className="flex flex-wrap items-center gap-2"><Select value={kind} onChange={(event) => switchReport(event.target.value)}>{REPORTS.map((report) => <option key={report.value} value={report.value}>{report.label}</option>)}</Select><label className="text-xs text-muted">Từ ngày <Input className="ml-1 inline-flex h-8 w-36" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label className="text-xs text-muted">Đến ngày <Input className="ml-1 inline-flex h-8 w-36" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label><p className="text-xs text-muted">{current.description}</p></div><Button variant="outline" onClick={() => void reload()}>Làm mới</Button></div>
    <div className="flex-1 overflow-auto p-5">{!loading && rows.length === 0 ? <EmptyState icon={BarChart3} title="Chưa có dữ liệu" description="Báo cáo sẽ hiển thị khi có dữ liệu nghiệp vụ phù hợp." /> : <table className="w-full text-sm"><thead className="border-b text-left text-xs text-muted"><tr>{columns.map((column) => <th className="p-2 whitespace-nowrap" key={column}>{LABELS[column] ?? column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr className="border-b border-border/70" key={`${index}-${String(row.code ?? row.serial ?? "row")}`}>{columns.map((column) => <td className="p-2 whitespace-nowrap" key={column}>{cell(row[column])}</td>)}</tr>)}</tbody></table>}</div>
  </div>;
}
