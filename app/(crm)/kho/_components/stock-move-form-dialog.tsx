"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ProductLookup } from "@/components/lookups/product-lookup";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import type { StockMoveReason, StockMoveStatus, StockMoveType } from "@/features/inventory/types";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useToast } from "@/components/ui/toast";
import { apiFetch, toQuery } from "@/lib/api-client";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type LineForm = { productId: string; qty: number };

const emptyLine = (): LineForm => ({ productId: "", qty: 1 });

type Props = { moveType: StockMoveType };

const TITLES: Record<StockMoveType, string> = {
  in: "Tạo phiếu nhập",
  out: "Tạo phiếu xuất",
  transfer: "Tạo điều chuyển",
};

const REASONS: Record<StockMoveType, { value: StockMoveReason; label: string; ref?: "supplier" | "customer" | "project" }[]> = {
  in: [{ value: "purchase_receipt", label: "Nhập hàng mới", ref: "supplier" }, { value: "customer_return", label: "Hàng khách trả lại", ref: "customer" }, { value: "warranty_receipt", label: "Hàng bảo hành nhập về", ref: "customer" }],
  out: [{ value: "installation_issue", label: "Xuất lắp đặt", ref: "project" }, { value: "sales_issue", label: "Xuất bán buôn / bán lẻ", ref: "customer" }, { value: "supplier_return", label: "Xuất trả nhà cung cấp", ref: "supplier" }],
  transfer: [{ value: "transfer", label: "Điều chuyển kho" }],
};

export function StockMoveFormDialog({ moveType }: Props) {
  const list = useListPage();
  const { createMove, warehouses } = useInventory();
  const { toast } = useToast();
  const open = list.createOpen;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    warehouseFrom: "",
    warehouseTo: "",
    requestId: "",
    reason: REASONS[moveType][0].value as StockMoveReason,
    supplierId: "", customerId: "", projectId: "",
    note: "",
    lines: [emptyLine()] as LineForm[],
  });
  const [references, setReferences] = useState<{ suppliers: { id: string; code: string; name: string }[]; customers: { id: string; code: string; name: string }[]; projects: { id: string; code: string; name: string }[] }>({ suppliers: [], customers: [], projects: [] });

  useEffect(() => {
    if (!open) return;
    setForm({
      warehouseFrom: "",
      warehouseTo: "",
      requestId: globalThis.crypto.randomUUID(),
      reason: REASONS[moveType][0].value,
      supplierId: "", customerId: "", projectId: "",
      note: "",
      lines: [emptyLine()],
    });
  }, [open, moveType]);

  useEffect(() => {
    if (!open) return;
    void Promise.all([apiFetch<{ id: string; code: string; name: string }[]>(`/api/v1/suppliers${toQuery({ pageSize: 100, status: "active" })}`).catch(() => ({ data: [] })), apiFetch<{ id: string; code: string; name: string }[]>(`/api/v1/customers${toQuery({ pageSize: 100, status: "active" })}`).catch(() => ({ data: [] })), apiFetch<{ id: string; code: string; name: string }[]>(`/api/v1/projects${toQuery({ pageSize: 100 })}`).catch(() => ({ data: [] }))]).then(([suppliers, customers, projects]) => setReferences({ suppliers: suppliers.data ?? [], customers: customers.data ?? [], projects: projects.data ?? [] }));
  }, [open]);

  useEffect(() => {
    if (!open || warehouses.length === 0) return;
    const defaultWarehouseId = warehouses.find((warehouse) => warehouse.isDefault)?.id ?? warehouses[0].id;
    setForm((current) => ({
      ...current,
      warehouseFrom: moveType === "in" ? "" : current.warehouseFrom || defaultWarehouseId,
      warehouseTo: moveType === "out" ? "" : current.warehouseTo || defaultWarehouseId,
    }));
  }, [open, warehouses, moveType]);

  function close() {
    list.setCreateOpen(false);
  }

  function setLine(index: number, patch: Partial<LineForm>) {
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line),
    }));
  }

  async function save(status: StockMoveStatus) {
    if (saving) return;
    if (form.lines.some((line) => !line.productId || line.qty <= 0)) {
      toast("Vui lòng thêm dòng sản phẩm hợp lệ", "error");
      return;
    }
    if (moveType === "in" && !form.warehouseTo) {
      toast("Vui lòng chọn kho nhận", "error");
      return;
    }
    if (moveType === "out" && !form.warehouseFrom) {
      toast("Vui lòng chọn kho xuất", "error");
      return;
    }
    if (moveType === "transfer" && (!form.warehouseFrom || !form.warehouseTo)) {
      toast("Vui lòng chọn kho nguồn và kho đích", "error");
      return;
    }
    const reasonMeta = REASONS[moveType].find((item) => item.value === form.reason);
    if (reasonMeta?.ref === "supplier" && !form.supplierId) return toast("Vui lòng chọn nhà cung cấp", "error");
    if (reasonMeta?.ref === "customer" && !form.customerId) return toast("Vui lòng chọn khách hàng", "error");
    if (reasonMeta?.ref === "project" && !form.projectId) return toast("Vui lòng chọn công trình", "error");

    setSaving(true);
    try {
      await createMove({
        type: moveType,
        reason: form.reason,
        status,
        requestId: form.requestId,
        warehouseFrom: form.warehouseFrom || undefined,
        warehouseTo: form.warehouseTo || undefined,
        supplierId: form.supplierId || undefined,
        customerId: form.customerId || undefined,
        projectId: form.projectId || undefined,
        note: form.note || undefined,
        lines: form.lines.map((line) => ({ productId: line.productId, qty: Number(line.qty) || 1 })),
      });
      toast(status === "posted" ? "Đã tạo và ghi sổ phiếu kho" : "Đã tạo phiếu nháp", "success");
      close();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể tạo phiếu kho", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(value) => !value && !saving && close()}
      title={TITLES[moveType]}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={saving}>Hủy</Button>
          <Button variant="outline" onClick={() => void save("draft")} disabled={saving || warehouses.length === 0}>
            {saving ? "Đang lưu..." : "Lưu nháp"}
          </Button>
          <Button variant="primary" onClick={() => void save("posted")} disabled={saving || warehouses.length === 0}>
            {saving ? "Đang lưu..." : "Ghi sổ"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {moveType !== "in" ? <WarehouseSelect label="Kho xuất *" value={form.warehouseFrom} warehouses={warehouses} placeholder="Chọn kho xuất" onChange={(warehouseFrom) => setForm((current) => ({ ...current, warehouseFrom }))} /> : null}
          {moveType !== "out" ? <WarehouseSelect label="Kho nhận *" value={form.warehouseTo} warehouses={warehouses} placeholder="Chọn kho nhận" onChange={(warehouseTo) => setForm((current) => ({ ...current, warehouseTo }))} /> : null}
          <label className="col-span-2 space-y-1 text-xs"><span className="text-muted">Nghiệp vụ *</span><Select value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value as StockMoveReason, supplierId: "", customerId: "", projectId: "" }))}>{REASONS[moveType].map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}</Select></label>
          {REASONS[moveType].find((item) => item.value === form.reason)?.ref === "supplier" ? <ReferenceSelect label="Nhà cung cấp *" value={form.supplierId} rows={references.suppliers} onChange={(supplierId) => setForm((current) => ({ ...current, supplierId }))} /> : null}
          {REASONS[moveType].find((item) => item.value === form.reason)?.ref === "customer" ? <ReferenceSelect label="Khách hàng *" value={form.customerId} rows={references.customers} onChange={(customerId) => setForm((current) => ({ ...current, customerId }))} /> : null}
          {REASONS[moveType].find((item) => item.value === form.reason)?.ref === "project" ? <ReferenceSelect label="Công trình *" value={form.projectId} rows={references.projects} onChange={(projectId) => setForm((current) => ({ ...current, projectId }))} /> : null}
          <label className="col-span-2 space-y-1 text-xs">
            <span className="text-muted">Ghi chú</span>
            <Input value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} />
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Dòng hàng</p>
            <Button variant="outline" size="sm" disabled={saving} onClick={() => setForm((current) => ({ ...current, lines: [...current.lines, emptyLine()] }))}>
              <Plus className="h-3.5 w-3.5" />Thêm dòng
            </Button>
          </div>
          {form.lines.map((line, index) => (
            <div key={index} className="flex items-end gap-2">
              <label className="min-w-0 flex-1 space-y-1 text-xs">
                <span className="text-muted">Sản phẩm</span>
                <ProductLookup className="w-full" value={line.productId} onChange={(productId) => setLine(index, { productId })} />
              </label>
              <label className="w-24 space-y-1 text-xs">
                <span className="text-muted">SL</span>
                <Input type="number" min={1} value={line.qty} onChange={(event) => setLine(index, { qty: Number(event.target.value) || 0 })} />
              </label>
              <Button variant="ghost" size="icon" disabled={saving || form.lines.length <= 1} onClick={() => setForm((current) => ({ ...current, lines: current.lines.filter((_, lineIndex) => lineIndex !== index) }))}>
                <Trash2 className="h-3.5 w-3.5 text-danger" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function ReferenceSelect({ label, value, rows, onChange }: { label: string; value: string; rows: { id: string; code: string; name: string }[]; onChange: (value: string) => void }) {
  return <label className="col-span-2 space-y-1 text-xs"><span className="text-muted">{label}</span><Select value={value} onChange={(event) => onChange(event.target.value)}><option value="" disabled>Chọn</option>{rows.map((row) => <option key={row.id} value={row.id}>{row.code} — {row.name}</option>)}</Select></label>;
}

function WarehouseSelect({ label, value, warehouses, placeholder, onChange }: {
  label: string;
  value: string;
  warehouses: { id: string; code: string; name: string; isDefault: boolean }[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 text-xs">
      <span className="text-muted">{label}</span>
      <Select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="" disabled>{placeholder}</option>
        {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} — {warehouse.name}</option>)}
      </Select>
    </label>
  );
}
