"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Plus, ScanLine } from "lucide-react";
import { AppHeader } from "@/components/shell/app-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { inventoryService } from "@/features/inventory/services/inventory-service";
import { productsService } from "@/features/products/services/products-service";
import { apiFetch, toQuery } from "@/lib/api-client";

type Product = { id: string; sku: string; name: string; itemType: "goods" | "service"; status: string };
type Warehouse = { id: string; code: string; name: string };
type Serial = {
  id: string; serial: string; productId: string; warehouseId?: string | null; status: string;
  warrantyUntil?: string | null; note?: string | null;
};
type InventoryCount = { id: string; code: string; warehouseId: string; status: "draft" | "posted" | "cancelled"; countedAt: string; note?: string | null };
type CountLine = { productId: string; countedQty: string };
type InventoryBalance = { warehouseId: string; productId: string; qty: number | string };
type InventoryCountDetail = InventoryCount & { lines: { id: string; productId: string; sku: string; productName: string; expectedQty: number | string; countedQty: number | string }[] };

export function countDifference(expectedQty: number | string, countedQty: number | string) {
  return Number(countedQty) - Number(expectedQty);
}

export function filterSerials<T extends Pick<Serial, "serial" | "productId" | "status">>(
  rows: T[],
  products: Pick<Product, "id" | "name">[],
  query: string,
  status: string,
) {
  const term = query.trim().toLocaleLowerCase("vi");
  return rows.filter((row) => {
    if (status && row.status !== status) return false;
    if (!term) return true;
    return [row.serial, products.find((product) => product.id === row.productId)?.name]
      .some((value) => value?.toLocaleLowerCase("vi").includes(term));
  });
}

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat("vi-VN").format(new Date(value)) : "—";
}

async function loadReferenceData() {
  const [products, warehouses, balances] = await Promise.all([
    productsService.list({ status: "active" }),
    inventoryService.listWarehouses(),
    apiFetch<InventoryBalance[]>("/api/v1/inventory/balances"),
  ]);
  return {
    products: products.filter((product) => product.itemType === "goods") as Product[],
    warehouses,
    balances: balances.data ?? [],
  };
}

export function SerialNumbersPage() {
  const { canCreate, canEdit } = useCurrentUser();
  const { toast } = useToast();
  const [rows, setRows] = useState<Serial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Serial | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ productId: "", serial: "", warehouseId: "", status: "in_stock", warrantyUntil: "", note: "" });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [serials, reference] = await Promise.all([
        apiFetch<Serial[]>(`/api/v1/serial-numbers${toQuery({ pageSize: 100 })}`),
        loadReferenceData(),
      ]);
      setRows(serials.data ?? []);
      setProducts(reference.products);
      setWarehouses(reference.warehouses);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể tải serial", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);
  useEffect(() => { void reload(); }, [reload]);

  const visibleRows = useMemo(() => filterSerials(rows, products, query, statusFilter), [products, query, rows, statusFilter]);

  function beginCreate() {
    setEditing(null);
    setForm({ productId: "", serial: "", warehouseId: "", status: "in_stock", warrantyUntil: "", note: "" });
    setOpen(true);
  }
  function beginEdit(row: Serial) {
    setEditing(row);
    setForm({ productId: row.productId, serial: row.serial, warehouseId: row.warehouseId ?? "", status: row.status, warrantyUntil: row.warrantyUntil?.slice(0, 10) ?? "", note: row.note ?? "" });
    setOpen(true);
  }
  async function save() {
    if (!form.productId || !form.serial.trim()) return toast("Chọn sản phẩm và nhập serial", "error");
    setSaving(true);
    try {
      const payload = { ...form, warehouseId: form.warehouseId || undefined, warrantyUntil: form.warrantyUntil || undefined, note: form.note || undefined };
      await apiFetch(editing ? `/api/v1/serial-numbers/${editing.id}` : "/api/v1/serial-numbers", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(editing ? { warehouseId: payload.warehouseId, status: payload.status, warrantyUntil: payload.warrantyUntil, note: payload.note } : payload),
      });
      toast(editing ? "Đã cập nhật serial" : "Đã thêm serial", "success");
      setOpen(false);
      await reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể lưu serial", "error");
    } finally { setSaving(false); }
  }

  return <div className="flex h-full min-h-0 flex-col">
    <AppHeader moduleLabel="Serial & bảo hành" onCreate={canCreate("inventory") ? beginCreate : undefined} createLabel="Thêm serial" />
    <div className="flex items-center gap-2 border-b border-border px-5 py-3"><Input className="w-72" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm serial hoặc sản phẩm..." /><Select className="w-44" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Tất cả trạng thái</option><option value="warranty">Đang bảo hành</option><option value="damaged">Hư hỏng</option></Select><Button variant="outline" onClick={() => void reload()}>Làm mới</Button></div>
    <div className="flex-1 overflow-auto p-5">
      {!loading && visibleRows.length === 0 ? <EmptyState icon={ScanLine} title="Chưa có serial" description="Thêm serial để tra cứu trạng thái, kho và bảo hành." action={canCreate("inventory") ? <Button variant="primary" onClick={beginCreate}><Plus className="h-3.5 w-3.5" />Thêm serial</Button> : undefined} /> :
        <table className="w-full text-sm"><thead className="border-b text-left text-xs text-muted"><tr><th className="p-2">Serial</th><th className="p-2">Sản phẩm</th><th className="p-2">Kho</th><th className="p-2">Trạng thái</th><th className="p-2">Hết bảo hành</th><th className="p-2" /></tr></thead><tbody>{visibleRows.map((row) => <tr key={row.id} className="border-b border-border/70"><td className="p-2 font-mono">{row.serial}</td><td className="p-2">{products.find((product) => product.id === row.productId)?.name ?? "—"}</td><td className="p-2">{warehouses.find((warehouse) => warehouse.id === row.warehouseId)?.name ?? "—"}</td><td className="p-2">{serialStatusLabel(row.status)}</td><td className="p-2">{formatDate(row.warrantyUntil)}</td><td className="p-2 text-right">{canEdit("inventory") ? <Button variant="outline" onClick={() => beginEdit(row)}>Cập nhật</Button> : null}</td></tr>)}</tbody></table>}
    </div>
    <Modal open={open} onOpenChange={(value) => !saving && setOpen(value)} title={editing ? "Cập nhật serial" : "Thêm serial"} footer={<><Button variant="outline" disabled={saving} onClick={() => setOpen(false)}>Hủy</Button><Button variant="primary" disabled={saving} onClick={() => void save()}>{saving ? "Đang lưu..." : "Lưu"}</Button></>}>
      <div className="grid grid-cols-2 gap-3"><FormSelect label="Sản phẩm *" disabled={Boolean(editing)} value={form.productId} onChange={(productId) => setForm((current) => ({ ...current, productId }))} options={products.map((product) => ({ value: product.id, label: `${product.sku} — ${product.name}` }))} /><FormField label="Serial *" disabled={Boolean(editing)} value={form.serial} onChange={(serial) => setForm((current) => ({ ...current, serial }))} /><FormSelect label="Kho" value={form.warehouseId} onChange={(warehouseId) => setForm((current) => ({ ...current, warehouseId }))} options={warehouses.map((warehouse) => ({ value: warehouse.id, label: `${warehouse.code} — ${warehouse.name}` }))} /><FormSelect label="Trạng thái" value={form.status} onChange={(status) => setForm((current) => ({ ...current, status }))} options={SERIAL_STATUSES} /><FormField label="Hết hạn bảo hành" type="date" value={form.warrantyUntil} onChange={(warrantyUntil) => setForm((current) => ({ ...current, warrantyUntil }))} /><FormField label="Ghi chú" value={form.note} onChange={(note) => setForm((current) => ({ ...current, note }))} /></div>
    </Modal>
  </div>;
}

export function InventoryCountsPage() {
  const { canCreate, canApprove } = useCurrentUser();
  const { toast } = useToast();
  const [rows, setRows] = useState<InventoryCount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [balances, setBalances] = useState<InventoryBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [postingId, setPostingId] = useState<string | null>(null);
  const [warehouseId, setWarehouseId] = useState("");
  const [countedAt, setCountedAt] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<CountLine[]>([{ productId: "", countedQty: "0" }]);
  const [viewing, setViewing] = useState<InventoryCountDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [counts, reference] = await Promise.all([apiFetch<InventoryCount[]>(`/api/v1/inventory-counts${toQuery({ pageSize: 100 })}`), loadReferenceData()]);
      setRows(counts.data ?? []); setProducts(reference.products); setWarehouses(reference.warehouses); setBalances(reference.balances);
    } catch (error) { toast(error instanceof Error ? error.message : "Không thể tải phiếu kiểm kê", "error"); }
    finally { setLoading(false); }
  }, [toast]);
  useEffect(() => { void reload(); }, [reload]);
  function expectedQty(productId: string, selectedWarehouseId = warehouseId) { return Number(balances.find((balance) => balance.warehouseId === selectedWarehouseId && balance.productId === productId)?.qty ?? 0); }
  function beginCreate() { setWarehouseId(""); setCountedAt(new Date().toISOString().slice(0, 10)); setNote(""); setLines([{ productId: "", countedQty: "0" }]); setOpen(true); }
  function selectWarehouse(value: string) { setWarehouseId(value); setLines((current) => current.map((line) => line.productId ? { ...line, countedQty: String(expectedQty(line.productId, value)) } : line)); }
  function changeLine(index: number, patch: Partial<CountLine>) { setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch, countedQty: patch.productId ? String(expectedQty(patch.productId)) : patch.countedQty ?? line.countedQty } : line)); }
  function adjustLine(index: number, change: number) { setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, countedQty: String(Math.max(0, Number(line.countedQty || 0) + change)) } : line)); }
  async function viewDetail(row: InventoryCount) { setDetailLoading(true); try { const result = await apiFetch<InventoryCountDetail>(`/api/v1/inventory-counts/${row.id}`); setViewing(result.data); } catch (error) { toast(error instanceof Error ? error.message : "Không thể tải chi tiết kiểm kê", "error"); } finally { setDetailLoading(false); } }
  async function save() {
    if (!warehouseId || lines.some((line) => !line.productId || line.countedQty === "")) return toast("Chọn kho, sản phẩm và số lượng thực tế", "error");
    if (new Set(lines.map((line) => line.productId)).size !== lines.length) return toast("Mỗi sản phẩm chỉ được nhập một lần", "error");
    setSaving(true);
    try {
      await apiFetch("/api/v1/inventory-counts", { method: "POST", body: JSON.stringify({ warehouseId, countedAt, note: note || undefined, lines: lines.map((line) => ({ productId: line.productId, countedQty: Number(line.countedQty) })) }) });
      toast("Đã tạo phiếu kiểm kê nháp", "success"); setOpen(false); await reload();
    } catch (error) { toast(error instanceof Error ? error.message : "Không thể tạo phiếu kiểm kê", "error"); }
    finally { setSaving(false); }
  }
  async function post(row: InventoryCount) {
    setPostingId(row.id);
    try { await apiFetch(`/api/v1/inventory-counts/${row.id}/post`, { method: "POST" }); toast("Đã ghi sổ và cập nhật tồn kho", "success"); await reload(); }
    catch (error) { toast(error instanceof Error ? error.message : "Không thể ghi sổ", "error"); }
    finally { setPostingId(null); }
  }
  return <div className="flex h-full min-h-0 flex-col">
    <AppHeader moduleLabel="Kiểm kê kho" onCreate={canCreate("inventory") ? beginCreate : undefined} createLabel="Tạo phiếu kiểm kê" />
    <div className="flex-1 overflow-auto p-5">{!loading && rows.length === 0 ? <EmptyState icon={ClipboardCheck} title="Chưa có phiếu kiểm kê" description="Tạo phiếu, nhập số đếm thực tế rồi ghi sổ để điều chỉnh tồn kho." action={canCreate("inventory") ? <Button variant="primary" onClick={beginCreate}><Plus className="h-3.5 w-3.5" />Tạo phiếu</Button> : undefined} /> : <table className="w-full text-sm"><thead className="border-b text-left text-xs text-muted"><tr><th className="p-2">Mã phiếu</th><th className="p-2">Kho</th><th className="p-2">Ngày kiểm</th><th className="p-2">Trạng thái</th><th className="p-2" /></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="cursor-pointer border-b border-border/70 hover:bg-muted-bg" onClick={() => void viewDetail(row)}><td className="p-2 font-mono">{row.code}</td><td className="p-2">{warehouses.find((warehouse) => warehouse.id === row.warehouseId)?.name ?? "—"}</td><td className="p-2">{formatDate(row.countedAt)}</td><td className="p-2">{row.status === "posted" ? "Đã ghi sổ" : row.status === "draft" ? "Nháp" : "Đã hủy"}</td><td className="p-2 text-right">{row.status === "draft" && canApprove("inventory") ? <Button variant="primary" disabled={postingId === row.id} onClick={(event) => { event.stopPropagation(); void post(row); }}>{postingId === row.id ? "Đang ghi sổ..." : "Ghi sổ"}</Button> : null}</td></tr>)}</tbody></table>}</div>
    <Modal open={open} onOpenChange={(value) => !saving && setOpen(value)} title="Tạo phiếu kiểm kê" description="Tồn kho được cập nhật khi người có quyền ghi sổ phiếu." size="xl" footer={<><Button variant="outline" disabled={saving} onClick={() => setOpen(false)}>Hủy</Button><Button variant="primary" disabled={saving} onClick={() => void save()}>{saving ? "Đang lưu..." : "Tạo phiếu"}</Button></>}>
      <div className="grid grid-cols-2 gap-3"><FormSelect label="Kho kiểm kê *" value={warehouseId} onChange={selectWarehouse} options={warehouses.map((warehouse) => ({ value: warehouse.id, label: `${warehouse.code} — ${warehouse.name}` }))} /><FormField label="Ngày kiểm kê" type="date" value={countedAt} onChange={setCountedAt} /></div><FormField label="Ghi chú" value={note} onChange={setNote} className="mt-3" />
      <div className="mt-4 space-y-2"><div className="flex items-center justify-between"><span className="text-sm font-medium">Số lượng kiểm kê và điều chỉnh</span><Button variant="outline" onClick={() => setLines((current) => [...current, { productId: "", countedQty: "0" }])}><Plus className="h-3.5 w-3.5" />Thêm dòng</Button></div>{lines.map((line, index) => { const expected = expectedQty(line.productId); const difference = countDifference(expected, line.countedQty); return <div key={index} className="grid grid-cols-[1fr_7rem_7rem_5rem_5rem_2rem] items-end gap-2"><FormSelect label={index === 0 ? "Sản phẩm *" : ""} value={line.productId} onChange={(productId) => changeLine(index, { productId })} options={products.map((product) => ({ value: product.id, label: `${product.sku} — ${product.name}` }))} /><label className="space-y-1 text-xs"><span className="text-muted">Tồn hệ thống</span><Input disabled value={line.productId ? String(expected) : "—"} /></label><FormField label={index === 0 ? "SL thực tế *" : ""} type="number" min="0" value={line.countedQty} onChange={(countedQty) => changeLine(index, { countedQty })} /><div className="space-y-1 text-xs"><span className="text-muted">Chênh lệch</span><p className={difference > 0 ? "h-9 pt-2 text-green-600" : difference < 0 ? "h-9 pt-2 text-danger" : "h-9 pt-2"}>{line.productId ? `${difference > 0 ? "+" : ""}${difference}` : "—"}</p></div><div className="flex gap-1"><Button variant="outline" size="icon" disabled={!line.productId || Number(line.countedQty) <= 0} title="Giảm tồn 1" onClick={() => adjustLine(index, -1)}>−</Button><Button variant="outline" size="icon" disabled={!line.productId} title="Tăng tồn 1" onClick={() => adjustLine(index, 1)}>+</Button></div>{lines.length > 1 ? <Button variant="ghost" size="icon" title="Xóa dòng" onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}>×</Button> : <span />}</div>; })}</div>
    </Modal>
    <Modal open={Boolean(viewing)} onOpenChange={(value) => !value && setViewing(null)} title={viewing ? `Chi tiết kiểm kê ${viewing.code}` : "Chi tiết kiểm kê"} size="xl" footer={<Button variant="outline" onClick={() => setViewing(null)}>Đóng</Button>}>
      {viewing ? <div className="space-y-3"><p className="text-sm text-muted">{warehouses.find((warehouse) => warehouse.id === viewing.warehouseId)?.name ?? "—"} · {formatDate(viewing.countedAt)}{viewing.note ? ` · ${viewing.note}` : ""}</p><table className="w-full text-sm"><thead className="border-b text-left text-xs text-muted"><tr><th className="p-2">Sản phẩm</th><th className="p-2 text-right">Tồn hệ thống</th><th className="p-2 text-right">Thực tế</th><th className="p-2 text-right">Chênh lệch</th></tr></thead><tbody>{viewing.lines.map((line) => { const difference = countDifference(line.expectedQty, line.countedQty); return <tr key={line.id} className="border-b border-border/70"><td className="p-2">{line.sku} — {line.productName}</td><td className="p-2 text-right">{line.expectedQty}</td><td className="p-2 text-right">{line.countedQty}</td><td className={difference > 0 ? "p-2 text-right text-green-600" : difference < 0 ? "p-2 text-right text-danger" : "p-2 text-right"}>{difference > 0 ? "+" : ""}{difference}</td></tr>; })}</tbody></table></div> : null}
    </Modal>
  </div>;
}

const SERIAL_STATUSES = [
  { value: "in_stock", label: "Trong kho" }, { value: "installed", label: "Đã lắp đặt" }, { value: "warranty", label: "Đang bảo hành" }, { value: "damaged", label: "Hư hỏng" }, { value: "returned", label: "Đã trả" },
];
function serialStatusLabel(status: string) { return SERIAL_STATUSES.find((item) => item.value === status)?.label ?? status; }
function FormField({ label, value, onChange, type = "text", className, ...props }: { label: string; value: string; onChange: (value: string) => void; type?: string; className?: string } & Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type">) { return <label className={`space-y-1 text-xs ${className ?? ""}`}><span className="text-muted">{label}</span><Input type={type} value={value} onChange={(event) => onChange(event.target.value)} {...props} /></label>; }
function FormSelect({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; disabled?: boolean }) { return <label className="space-y-1 text-xs"><span className="text-muted">{label}</span><Select className="w-full" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}><option value="">Chọn</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></label>; }
