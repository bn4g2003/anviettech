"use client";

import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Boxes, HardHat, Plus, Truck } from "lucide-react";
import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { FilterBar } from "@/components/datagrid/filter-bar";
import { RowActions } from "@/components/datagrid/row-actions";
import { AppHeader } from "@/components/shell/app-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { StatusDot } from "@/components/ui/status-dot";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { apiFetch, toQuery } from "@/lib/api-client";

type Supplier = {
  id: string; code: string; name: string; contactName?: string | null; phone?: string | null;
  email?: string | null; address?: string | null; status: "active" | "inactive"; notes?: string | null; ownerId?: string | null;
};
type Project = {
  id: string; code: string; name: string; customerId: string; address?: string | null;
  status: "planning" | "active" | "completed" | "cancelled"; startDate?: string | null; endDate?: string | null; notes?: string | null; ownerId?: string | null;
};
type Warehouse = { id: string; code: string; name: string; address?: string | null; isDefault: boolean };
type Customer = { id: string; code: string; name: string };
type Kind = "suppliers" | "projects" | "warehouses";

const projectStatus = {
  planning: { label: "Chuẩn bị", color: "gray" },
  active: { label: "Đang thực hiện", color: "blue" },
  completed: { label: "Hoàn thành", color: "green" },
  cancelled: { label: "Đã hủy", color: "red" },
} as const;

const initialSupplier = { name: "", contactName: "", phone: "", email: "", address: "", status: "active", notes: "" };
const initialProject = { name: "", customerId: "", address: "", status: "planning", startDate: "", endDate: "", notes: "" };
const initialWarehouse = { code: "", name: "", address: "", isDefault: "false" };

export function InventoryMasterDataPage({ kind }: { kind: Kind }) {
  const isSupplier = kind === "suppliers";
  const isProject = kind === "projects";
  const isWarehouse = kind === "warehouses";
  const resourceModule = isWarehouse ? "inventory" : kind;
  const { canCreate, canEdit, canDelete } = useCurrentUser();
  const { toast } = useToast();
  const [rows, setRows] = useState<(Supplier | Project | Warehouse)[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | Project | Warehouse | null>(null);
  const [form, setForm] = useState<Record<string, string>>(isSupplier ? initialSupplier : isProject ? initialProject : initialWarehouse);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [result, customerResult] = await Promise.all([
        apiFetch<(Supplier | Project | Warehouse)[]>(`/api/v1/${kind}${toQuery({ pageSize: 100 })}`),
        isProject ? apiFetch<Customer[]>(`/api/v1/customers${toQuery({ pageSize: 100, status: "active" })}`) : Promise.resolve(null),
      ]);
      setRows(result.data ?? []);
      setCustomers(customerResult?.data ?? []);
    } catch (error) {
      setRows([]);
      toast(error instanceof Error ? error.message : "Không thể tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  }, [isProject, kind, toast]);

  useEffect(() => { void reload(); }, [reload]);

  const visibleRows = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("vi");
    if (!term) return rows;
    return rows.filter((row) => {
      const project = row as Project;
      const supplier = row as Supplier;
      const customer = customers.find((item) => item.id === project.customerId)?.name ?? "";
      return [row.code, row.name, supplier.contactName, supplier.phone, supplier.email, customer]
        .filter(Boolean).some((value) => String(value).toLocaleLowerCase("vi").includes(term));
    });
  }, [customers, query, rows]);

  function openCreate() {
    setEditing(null);
    setForm(isSupplier ? initialSupplier : isProject ? initialProject : initialWarehouse);
    setOpen(true);
  }

  function openEdit(row: Supplier | Project | Warehouse) {
    setEditing(row);
    if (isSupplier) {
      const supplier = row as Supplier;
      setForm({ name: supplier.name, contactName: supplier.contactName ?? "", phone: supplier.phone ?? "", email: supplier.email ?? "", address: supplier.address ?? "", status: supplier.status, notes: supplier.notes ?? "" });
    } else if (isProject) {
      const project = row as Project;
      setForm({ name: project.name, customerId: project.customerId, address: project.address ?? "", status: project.status, startDate: project.startDate?.slice(0, 10) ?? "", endDate: project.endDate?.slice(0, 10) ?? "", notes: project.notes ?? "" });
    } else {
      const warehouse = row as Warehouse;
      setForm({ code: warehouse.code, name: warehouse.name, address: warehouse.address ?? "", isDefault: String(warehouse.isDefault) });
    }
    setOpen(true);
  }

  async function save() {
    if (!form.name?.trim()) return toast(isSupplier ? "Vui lòng nhập tên nhà cung cấp" : isProject ? "Vui lòng nhập tên công trình" : "Vui lòng nhập tên kho", "error");
    if (isWarehouse && !form.code?.trim()) return toast("Vui lòng nhập mã kho", "error");
    if (isProject && !form.customerId) return toast("Vui lòng chọn khách hàng", "error");
    setSaving(true);
    try {
      const path = editing ? `/api/v1/${kind}/${editing.id}` : `/api/v1/${kind}`;
      const payload = isWarehouse ? { ...form, isDefault: form.isDefault === "true" } : form;
      await apiFetch(path, { method: editing ? "PATCH" : "POST", body: JSON.stringify(payload) });
      toast(editing ? "Đã cập nhật" : "Đã tạo mới", "success");
      setOpen(false);
      await reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể lưu", "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Supplier | Project | Warehouse) {
    const label = isSupplier ? "nhà cung cấp" : isProject ? "công trình" : "kho";
    if (!window.confirm(`Xóa ${label} “${row.name}”?`)) return;
    try {
      await apiFetch(`/api/v1/${kind}/${row.id}`, { method: "DELETE" });
      toast("Đã xóa", "success");
      await reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể xóa", "error");
    }
  }

  const columns: DataGridColumn<Supplier | Project | Warehouse>[] = isSupplier ? [
    { id: "code", header: "Mã", width: "w-32", cell: (row) => <span className="font-mono text-xs">{row.code}</span> },
    { id: "name", header: "Nhà cung cấp", cell: (row) => <span className="font-medium">{row.name}</span> },
    { id: "contact", header: "Người liên hệ", cell: (row) => (row as Supplier).contactName || "—" },
    { id: "phone", header: "Điện thoại", cell: (row) => (row as Supplier).phone || "—" },
    { id: "status", header: "Trạng thái", cell: (row) => <StatusDot color={(row as Supplier).status === "active" ? "green" : "gray"} label={(row as Supplier).status === "active" ? "Đang hợp tác" : "Ngưng"} /> },
    { id: "actions", header: "Thao tác", sticky: "right", cell: (row) => <RowActions onEdit={canEdit(resourceModule, (row as Supplier).ownerId ?? undefined) ? () => openEdit(row) : undefined} onDelete={canDelete(resourceModule, (row as Supplier).ownerId ?? undefined) ? () => void remove(row) : undefined} /> },
  ] : isProject ? [
    { id: "code", header: "Mã", width: "w-32", cell: (row) => <span className="font-mono text-xs">{row.code}</span> },
    { id: "name", header: "Công trình", cell: (row) => <span className="font-medium">{row.name}</span> },
    { id: "customer", header: "Khách hàng", cell: (row) => customers.find((customer) => customer.id === (row as Project).customerId)?.name ?? "—" },
    { id: "period", header: "Thời gian", cell: (row) => { const project = row as Project; return project.startDate || project.endDate ? `${project.startDate?.slice(0, 10) ?? "—"} → ${project.endDate?.slice(0, 10) ?? "—"}` : "—"; } },
    { id: "status", header: "Trạng thái", cell: (row) => { const meta = projectStatus[(row as Project).status]; return <StatusDot color={meta.color} label={meta.label} />; } },
    { id: "actions", header: "Thao tác", sticky: "right", cell: (row) => <RowActions onEdit={canEdit(resourceModule, (row as Project).ownerId ?? undefined) ? () => openEdit(row) : undefined} onDelete={canDelete(resourceModule, (row as Project).ownerId ?? undefined) ? () => void remove(row) : undefined} /> },
  ] : [
    { id: "code", header: "Mã kho", width: "w-32", cell: (row) => <span className="font-mono text-xs">{row.code}</span> },
    { id: "name", header: "Tên kho", cell: (row) => <span className="font-medium">{row.name}</span> },
    { id: "address", header: "Địa chỉ", cell: (row) => (row as Warehouse).address || "—" },
    { id: "default", header: "Mặc định", cell: (row) => (row as Warehouse).isDefault ? <StatusDot color="green" label="Kho mặc định" /> : "—" },
    { id: "actions", header: "Thao tác", sticky: "right", cell: (row) => <RowActions onEdit={canEdit(resourceModule) ? () => openEdit(row) : undefined} onDelete={canDelete(resourceModule) ? () => void remove(row) : undefined} /> },
  ];

  const Icon = isSupplier ? Truck : isProject ? HardHat : Boxes;
  const noun = isSupplier ? "nhà cung cấp" : isProject ? "công trình" : "kho";
  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader moduleLabel={isSupplier ? "Nhà cung cấp" : isProject ? "Công trình" : "Kho bãi"} onCreate={canCreate(resourceModule) ? openCreate : undefined} createLabel="Tạo" />
      <FilterBar search={<Input className="w-64" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Tìm ${noun}...`} />} actions={<Button variant="outline" size="sm" onClick={() => void reload()}>Làm mới</Button>} />
      <DataGrid columns={columns} rows={visibleRows} loading={loading} empty={<EmptyState icon={Icon} title={`Chưa có ${noun}`} description={`Tạo ${noun} để dùng cho vận hành kho và thi công.`} action={canCreate(resourceModule) ? <Button variant="primary" onClick={openCreate}><Plus className="h-3.5 w-3.5" />Tạo mới</Button> : undefined} />} />
      <Modal open={open} onOpenChange={(value) => !saving && setOpen(value)} title={editing ? `Sửa ${noun}` : `Tạo ${noun}`} size="lg" footer={<><Button variant="outline" disabled={saving} onClick={() => setOpen(false)}>Hủy</Button><Button variant="primary" disabled={saving} onClick={() => void save()}>{saving ? "Đang lưu..." : "Lưu"}</Button></>}>
        {isSupplier ? <SupplierForm form={form} setForm={setForm} /> : isProject ? <ProjectForm form={form} setForm={setForm} customers={customers} /> : <WarehouseForm form={form} setForm={setForm} />}
      </Modal>
    </div>
  );
}

function SupplierForm({ form, setForm }: { form: Record<string, string>; setForm: Dispatch<SetStateAction<Record<string, string>>> }) {
  return <div className="grid grid-cols-2 gap-3"><Field label="Tên nhà cung cấp *" value={form.name} onChange={(name) => setForm((current) => ({ ...current, name }))} className="col-span-2" /><Field label="Người liên hệ" value={form.contactName} onChange={(contactName) => setForm((current) => ({ ...current, contactName }))} /><Field label="Điện thoại" value={form.phone} onChange={(phone) => setForm((current) => ({ ...current, phone }))} /><Field label="Email" type="email" value={form.email} onChange={(email) => setForm((current) => ({ ...current, email }))} /><label className="space-y-1 text-xs"><span className="text-muted">Trạng thái</span><Select className="w-full" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option value="active">Đang hợp tác</option><option value="inactive">Ngưng</option></Select></label><Field label="Địa chỉ" value={form.address} onChange={(address) => setForm((current) => ({ ...current, address }))} className="col-span-2" /><Field label="Ghi chú" value={form.notes} onChange={(notes) => setForm((current) => ({ ...current, notes }))} className="col-span-2" /></div>;
}

function ProjectForm({ form, setForm, customers }: { form: Record<string, string>; setForm: Dispatch<SetStateAction<Record<string, string>>>; customers: Customer[] }) {
  return <div className="grid grid-cols-2 gap-3"><Field label="Tên công trình *" value={form.name} onChange={(name) => setForm((current) => ({ ...current, name }))} className="col-span-2" /><label className="col-span-2 space-y-1 text-xs"><span className="text-muted">Khách hàng *</span><Select className="w-full" value={form.customerId} onChange={(event) => setForm((current) => ({ ...current, customerId: event.target.value }))}><option value="">Chọn khách hàng</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.code} — {customer.name}</option>)}</Select></label><Field label="Ngày bắt đầu" type="date" value={form.startDate} onChange={(startDate) => setForm((current) => ({ ...current, startDate }))} /><Field label="Ngày kết thúc" type="date" value={form.endDate} onChange={(endDate) => setForm((current) => ({ ...current, endDate }))} /><label className="space-y-1 text-xs"><span className="text-muted">Trạng thái</span><Select className="w-full" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>{Object.entries(projectStatus).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</Select></label><Field label="Địa chỉ công trình" value={form.address} onChange={(address) => setForm((current) => ({ ...current, address }))} /><Field label="Ghi chú" value={form.notes} onChange={(notes) => setForm((current) => ({ ...current, notes }))} className="col-span-2" /></div>;
}

function WarehouseForm({ form, setForm }: { form: Record<string, string>; setForm: Dispatch<SetStateAction<Record<string, string>>> }) {
  return <div className="grid grid-cols-2 gap-3"><Field label="Mã kho *" value={form.code} onChange={(code) => setForm((current) => ({ ...current, code }))} /><Field label="Tên kho *" value={form.name} onChange={(name) => setForm((current) => ({ ...current, name }))} /><label className="col-span-2 space-y-1 text-xs"><span className="text-muted">Kho mặc định</span><Select className="w-full" value={form.isDefault} onChange={(event) => setForm((current) => ({ ...current, isDefault: event.target.value }))}><option value="false">Không</option><option value="true">Có — chuyển mặc định sang kho này</option></Select></label><Field label="Địa chỉ" value={form.address} onChange={(address) => setForm((current) => ({ ...current, address }))} className="col-span-2" /></div>;
}

function Field({ label, value, onChange, type = "text", className }: { label: string; value?: string; onChange: (value: string) => void; type?: string; className?: string }) {
  return <label className={`space-y-1 text-xs ${className ?? ""}`}><span className="text-muted">{label}</span><Input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} /></label>;
}
