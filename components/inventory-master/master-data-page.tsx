"use client";

import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Boxes, HardHat, Plus, Truck, RefreshCw } from "lucide-react";
import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { FilterBar } from "@/components/datagrid/filter-bar";
import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { Pagination } from "@/components/datagrid/pagination";
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

const SUPPLIER_COLUMN_DEFS = [
  { id: "code", label: "Mã NCC" },
  { id: "name", label: "Nhà cung cấp" },
  { id: "contact", label: "Người liên hệ" },
  { id: "phone", label: "Điện thoại" },
  { id: "email", label: "Email" },
  { id: "address", label: "Địa chỉ" },
  { id: "status", label: "Trạng thái" },
  { id: "actions", label: "Thao tác" },
];

const PROJECT_COLUMN_DEFS = [
  { id: "code", label: "Mã CT" },
  { id: "name", label: "Công trình" },
  { id: "customer", label: "Khách hàng" },
  { id: "period", label: "Thời gian" },
  { id: "address", label: "Địa chỉ" },
  { id: "status", label: "Trạng thái" },
  { id: "actions", label: "Thao tác" },
];

const WAREHOUSE_COLUMN_DEFS = [
  { id: "code", label: "Mã kho" },
  { id: "name", label: "Tên kho" },
  { id: "address", label: "Địa chỉ" },
  { id: "default", label: "Mặc định" },
  { id: "actions", label: "Thao tác" },
];

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
  const [statusFilter, setStatusFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortKey, setSortKey] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const defaultColDefs = isSupplier
    ? SUPPLIER_COLUMN_DEFS
    : isProject
    ? PROJECT_COLUMN_DEFS
    : WAREHOUSE_COLUMN_DEFS;
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColDefs.map((c) => c.id));

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | Project | Warehouse | null>(null);
  const [form, setForm] = useState<Record<string, string>>(
    isSupplier ? initialSupplier : isProject ? initialProject : initialWarehouse
  );
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [result, customerResult] = await Promise.all([
        apiFetch<(Supplier | Project | Warehouse)[]>(`/api/v1/${kind}${toQuery({ pageSize: 500 })}`),
        isProject
          ? apiFetch<Customer[]>(`/api/v1/customers${toQuery({ pageSize: 500, status: "active" })}`)
          : Promise.resolve(null),
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

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("vi");
    return rows.filter((row) => {
      if (isSupplier) {
        const s = row as Supplier;
        if (statusFilter && s.status !== statusFilter) return false;
      }
      if (isProject) {
        const p = row as Project;
        if (statusFilter && p.status !== statusFilter) return false;
        if (customerFilter && p.customerId !== customerFilter) return false;
      }
      if (!term) return true;
      const project = row as Project;
      const supplier = row as Supplier;
      const customer = customers.find((item) => item.id === project.customerId)?.name ?? "";
      return [row.code, row.name, supplier.contactName, supplier.phone, supplier.email, customer]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("vi").includes(term));
    });
  }, [customers, query, rows, isSupplier, isProject, statusFilter, customerFilter]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = String((a as Record<string, unknown>)[sortKey] ?? "");
      const bv = String((b as Record<string, unknown>)[sortKey] ?? "");
      return av.localeCompare(bv, "vi") * dir;
    });
  }, [filtered, sortKey, sortDir]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  function openCreate() {
    setEditing(null);
    setForm(isSupplier ? initialSupplier : isProject ? initialProject : initialWarehouse);
    setOpen(true);
  }

  function openEdit(row: Supplier | Project | Warehouse) {
    setEditing(row);
    if (isSupplier) {
      const supplier = row as Supplier;
      setForm({
        name: supplier.name,
        contactName: supplier.contactName ?? "",
        phone: supplier.phone ?? "",
        email: supplier.email ?? "",
        address: supplier.address ?? "",
        status: supplier.status,
        notes: supplier.notes ?? "",
      });
    } else if (isProject) {
      const project = row as Project;
      setForm({
        name: project.name,
        customerId: project.customerId,
        address: project.address ?? "",
        status: project.status,
        startDate: project.startDate?.slice(0, 10) ?? "",
        endDate: project.endDate?.slice(0, 10) ?? "",
        notes: project.notes ?? "",
      });
    } else {
      const warehouse = row as Warehouse;
      setForm({
        code: warehouse.code,
        name: warehouse.name,
        address: warehouse.address ?? "",
        isDefault: String(warehouse.isDefault),
      });
    }
    setOpen(true);
  }

  async function save() {
    if (!form.name?.trim()) {
      return toast(
        isSupplier
          ? "Vui lòng nhập tên nhà cung cấp"
          : isProject
          ? "Vui lòng nhập tên công trình"
          : "Vui lòng nhập tên kho",
        "error"
      );
    }
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
      toast("Đã xóa thành công", "success");
      await reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể xóa", "error");
    }
  }

  const allColumns: DataGridColumn<Supplier | Project | Warehouse>[] = isSupplier
    ? [
        {
          id: "code",
          header: "Mã NCC",
          width: "w-28",
          sortable: true,
          cell: (row) => <span className="font-mono text-xs font-semibold text-foreground/90">{row.code}</span>,
        },
        {
          id: "name",
          header: "Nhà cung cấp",
          sortable: true,
          cell: (row) => <span className="font-medium text-foreground">{row.name}</span>,
        },
        {
          id: "contact",
          header: "Người liên hệ",
          cell: (row) => (row as Supplier).contactName || "—",
        },
        {
          id: "phone",
          header: "Điện thoại",
          cell: (row) => (row as Supplier).phone || "—",
        },
        {
          id: "email",
          header: "Email",
          cell: (row) => <span className="text-muted">{(row as Supplier).email || "—"}</span>,
        },
        {
          id: "address",
          header: "Địa chỉ",
          cell: (row) => <span className="text-muted">{(row as Supplier).address || "—"}</span>,
        },
        {
          id: "status",
          header: "Trạng thái",
          width: "w-32",
          cell: (row) => (
            <StatusDot
              color={(row as Supplier).status === "active" ? "green" : "gray"}
              label={(row as Supplier).status === "active" ? "Đang hợp tác" : "Ngưng"}
            />
          ),
        },
        {
          id: "actions",
          header: "Thao tác",
          sticky: "right",
          width: "w-24",
          cell: (row) => (
            <RowActions
              onEdit={
                canEdit(resourceModule, (row as Supplier).ownerId ?? undefined)
                  ? () => openEdit(row)
                  : undefined
              }
              onDelete={
                canDelete(resourceModule, (row as Supplier).ownerId ?? undefined)
                  ? () => void remove(row)
                  : undefined
              }
            />
          ),
        },
      ]
    : isProject
    ? [
        {
          id: "code",
          header: "Mã CT",
          width: "w-28",
          sortable: true,
          cell: (row) => <span className="font-mono text-xs font-semibold text-foreground/90">{row.code}</span>,
        },
        {
          id: "name",
          header: "Công trình",
          sortable: true,
          cell: (row) => <span className="font-medium text-foreground">{row.name}</span>,
        },
        {
          id: "customer",
          header: "Khách hàng",
          sortable: true,
          cell: (row) => (
            <span className="text-foreground/90">
              {customers.find((customer) => customer.id === (row as Project).customerId)?.name ?? "—"}
            </span>
          ),
        },
        {
          id: "period",
          header: "Thời gian",
          cell: (row) => {
            const project = row as Project;
            return project.startDate || project.endDate
              ? `${project.startDate?.slice(0, 10) ?? "—"} → ${project.endDate?.slice(0, 10) ?? "—"}`
              : "—";
          },
        },
        {
          id: "address",
          header: "Địa chỉ công trình",
          cell: (row) => <span className="text-muted">{(row as Project).address || "—"}</span>,
        },
        {
          id: "status",
          header: "Trạng thái",
          width: "w-36",
          cell: (row) => {
            const meta = projectStatus[(row as Project).status];
            return <StatusDot color={meta.color} label={meta.label} />;
          },
        },
        {
          id: "actions",
          header: "Thao tác",
          sticky: "right",
          width: "w-24",
          cell: (row) => (
            <RowActions
              onEdit={
                canEdit(resourceModule, (row as Project).ownerId ?? undefined)
                  ? () => openEdit(row)
                  : undefined
              }
              onDelete={
                canDelete(resourceModule, (row as Project).ownerId ?? undefined)
                  ? () => void remove(row)
                  : undefined
              }
            />
          ),
        },
      ]
    : [
        {
          id: "code",
          header: "Mã kho",
          width: "w-28",
          sortable: true,
          cell: (row) => <span className="font-mono text-xs font-semibold text-foreground/90">{row.code}</span>,
        },
        {
          id: "name",
          header: "Tên kho",
          sortable: true,
          cell: (row) => <span className="font-medium text-foreground">{row.name}</span>,
        },
        {
          id: "address",
          header: "Địa chỉ kho",
          cell: (row) => <span className="text-muted">{(row as Warehouse).address || "—"}</span>,
        },
        {
          id: "default",
          header: "Mặc định",
          width: "w-32",
          cell: (row) =>
            (row as Warehouse).isDefault ? (
              <StatusDot color="green" label="Kho mặc định" />
            ) : (
              <span className="text-muted">—</span>
            ),
        },
        {
          id: "actions",
          header: "Thao tác",
          sticky: "right",
          width: "w-24",
          cell: (row) => (
            <RowActions
              onEdit={canEdit(resourceModule) ? () => openEdit(row) : undefined}
              onDelete={canDelete(resourceModule) ? () => void remove(row) : undefined}
            />
          ),
        },
      ];

  const columns = allColumns.filter((c) => visibleColumns.includes(c.id));
  const Icon = isSupplier ? Truck : isProject ? HardHat : Boxes;
  const noun = isSupplier ? "nhà cung cấp" : isProject ? "công trình" : "kho";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader
        moduleLabel={isSupplier ? "Nhà cung cấp" : isProject ? "Công trình" : "Kho bãi"}
        onCreate={canCreate(resourceModule) ? openCreate : undefined}
        createLabel="Tạo mới"
      />

      <FilterBar
        filters={
          <>
            <Input
              className="w-56"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={`Tìm kiếm ${noun}...`}
            />
            {isSupplier ? (
              <Select
                className="w-40"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Trạng thái</option>
                <option value="active">Đang hợp tác</option>
                <option value="inactive">Ngưng</option>
              </Select>
            ) : null}
            {isProject ? (
              <>
                <Select
                  className="w-36 max-w-[150px] truncate text-xs"
                  value={customerFilter}
                  onChange={(e) => {
                    setCustomerFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Khách hàng</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </Select>
                <Select
                  className="w-40"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Trạng thái</option>
                  {Object.entries(projectStatus).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </Select>
              </>
            ) : null}
          </>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="icon"
              title="Làm mới"
              onClick={() => void reload()}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <ColumnToggle
              columns={defaultColDefs}
              visibleIds={visibleColumns}
              onChange={setVisibleColumns}
            />
          </>
        }
      />

      <DataGrid
        columns={columns}
        rows={paginated}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={toggleSort}
        loading={loading}
        empty={
          <EmptyState
            icon={Icon}
            title={`Chưa có ${noun}`}
            description={`Tạo ${noun} để dùng cho vận hành kho và thi công.`}
            action={
              canCreate(resourceModule) ? (
                <Button variant="primary" onClick={openCreate}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Tạo mới
                </Button>
              ) : undefined
            }
          />
        }
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={sorted.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <Modal
        open={open}
        onOpenChange={(value) => !saving && setOpen(value)}
        title={editing ? `Sửa ${noun}` : `Tạo ${noun}`}
        size="lg"
        footer={
          <>
            <Button variant="outline" disabled={saving} onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button disabled={saving} onClick={() => void save()}>
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </>
        }
      >
        {isSupplier ? (
          <SupplierForm form={form} setForm={setForm} />
        ) : isProject ? (
          <ProjectForm form={form} setForm={setForm} customers={customers} />
        ) : (
          <WarehouseForm form={form} setForm={setForm} />
        )}
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
