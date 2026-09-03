"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatVnd } from "@/features/shared/utils/money";
import { apiFetch, toQuery } from "@/lib/api-client";

type Expense = { id: string; code: string; category: keyof typeof CATEGORY_LABEL; amount: number | string; expenseDate: string; note?: string | null };

const CATEGORY_LABEL = {
  salary: "Tiền lương", insurance: "Bảo hiểm", office_rent: "Thuê văn phòng", tax: "Thuế",
  management: "Quản lý doanh nghiệp", tech_dept: "Phòng kỹ thuật", other: "Khác",
} as const;

export function OperatingExpensesPanel() {
  const { canCreate } = useCurrentUser();
  const { createOpen, setCreateOpen } = useListPage();
  const { toast } = useToast();
  const [rows, setRows] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category: "other", amount: "", expenseDate: new Date().toISOString().slice(0, 10), note: "" });
  const reload = useCallback(async () => {
    setLoading(true);
    try { const result = await apiFetch<Expense[]>(`/api/v1/operating-expenses${toQuery({ pageSize: 100 })}`); setRows(result.data ?? []); }
    catch (error) { toast(error instanceof Error ? error.message : "Không thể tải chi phí", "error"); }
    finally { setLoading(false); }
  }, [toast]);
  useEffect(() => { void reload(); }, [reload]);
  const total = useMemo(() => rows.reduce((sum, row) => sum + Number(row.amount), 0), [rows]);
  function openCreate() { setForm({ category: "other", amount: "", expenseDate: new Date().toISOString().slice(0, 10), note: "" }); setCreateOpen(true); }
  async function save() {
    if (!form.amount || Number(form.amount) <= 0) return toast("Nhập số tiền chi phí lớn hơn 0", "error");
    setSaving(true);
    try {
      await apiFetch("/api/v1/operating-expenses", { method: "POST", body: JSON.stringify({ ...form, amount: Number(form.amount), note: form.note || undefined }) });
      toast("Đã ghi nhận chi phí", "success"); setCreateOpen(false); await reload();
    } catch (error) { toast(error instanceof Error ? error.message : "Không thể ghi nhận chi phí", "error"); }
    finally { setSaving(false); }
  }
  return <>
    <div className="flex items-center justify-between border-b border-border px-5 py-3"><p className="text-sm text-muted">Tổng chi phí đang hiển thị: <span className="font-medium text-foreground">{formatVnd(total)}</span></p><Button variant="outline" onClick={() => void reload()}>Làm mới</Button></div>
    <div className="flex-1 overflow-auto p-5">{!loading && rows.length === 0 ? <EmptyState icon={ReceiptText} title="Chưa có chi phí vận hành" description="Ghi nhận chi phí để báo cáo lãi/lỗ phản ánh số liệu thực tế." action={canCreate("finance") ? <Button variant="primary" onClick={openCreate}>Ghi nhận chi phí</Button> : undefined} /> : <table className="w-full text-sm"><thead className="border-b text-left text-xs text-muted"><tr><th className="p-2">Mã</th><th className="p-2">Nhóm chi phí</th><th className="p-2">Ngày</th><th className="p-2">Ghi chú</th><th className="p-2 text-right">Số tiền</th></tr></thead><tbody>{rows.map((row) => <tr className="border-b border-border/70" key={row.id}><td className="p-2 font-mono">{row.code}</td><td className="p-2">{CATEGORY_LABEL[row.category] ?? row.category}</td><td className="p-2">{new Intl.DateTimeFormat("vi-VN").format(new Date(row.expenseDate))}</td><td className="p-2">{row.note || "—"}</td><td className="p-2 text-right font-medium">{formatVnd(Number(row.amount))}</td></tr>)}</tbody></table>}</div>
    <Modal open={createOpen} onOpenChange={(value) => !saving && setCreateOpen(value)} title="Ghi nhận chi phí vận hành" footer={<><Button variant="outline" disabled={saving} onClick={() => setCreateOpen(false)}>Hủy</Button><Button variant="primary" disabled={saving} onClick={() => void save()}>{saving ? "Đang lưu..." : "Lưu chi phí"}</Button></>}><div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-xs"><span className="text-muted">Nhóm chi phí *</span><Select className="w-full" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>{Object.entries(CATEGORY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label><label className="space-y-1 text-xs"><span className="text-muted">Ngày phát sinh *</span><Input type="date" value={form.expenseDate} onChange={(event) => setForm((current) => ({ ...current, expenseDate: event.target.value }))} /></label><label className="col-span-2 space-y-1 text-xs"><span className="text-muted">Số tiền *</span><Input type="number" min="1" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="VD: 1500000" /></label><label className="col-span-2 space-y-1 text-xs"><span className="text-muted">Ghi chú</span><Input value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} /></label></div></Modal>
  </>;
}
