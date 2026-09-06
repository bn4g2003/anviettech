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

import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { FilterBar } from "@/components/datagrid/filter-bar";
import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { Pagination } from "@/components/datagrid/pagination";
import { StatusDot } from "@/components/ui/status-dot";
import { Pencil, Eye, CheckCircle2, RefreshCw } from "lucide-react";

const SERIAL_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  in_stock: { label: "Trong kho", color: "green" },
  installed: { label: "Đã lắp đặt", color: "blue" },
  warranty: { label: "Đang bảo hành", color: "yellow" },
  damaged: { label: "Hư hỏng", color: "red" },
  returned: { label: "Đã trả", color: "purple" },
};

const COUNT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Nháp", color: "gray" },
  posted: { label: "Đã ghi sổ", color: "green" },
  cancelled: { label: "Đã hủy", color: "red" },
};

const SERIAL_COLUMN_DEFS = [
  { id: "serial", label: "Serial" },
  { id: "product", label: "Sản phẩm" },
  { id: "warehouse", label: "Kho" },
  { id: "status", label: "Trạng thái" },
  { id: "warrantyUntil", label: "Hết hạn BH" },
  { id: "note", label: "Ghi chú" },
  { id: "actions", label: "Thao tác" },
];

const COUNT_COLUMN_DEFS = [
  { id: "code", label: "Mã phiếu" },
  { id: "warehouse", label: "Kho kiểm kê" },
  { id: "countedAt", label: "Ngày kiểm" },
  { id: "note", label: "Ghi chú" },
  { id: "status", label: "Trạng thái" },
  { id: "actions", label: "Thao tác" },
];

export function SerialNumbersPage() {
  const { canCreate, canEdit } = useCurrentUser();
  const { toast } = useToast();
  const [rows, setRows] = useState<Serial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortKey, setSortKey] = useState<string>("serial");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(SERIAL_COLUMN_DEFS.map((c) => c.id));

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Serial | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    productId: "",
    serial: "",
    warehouseId: "",
    status: "in_stock",
    warrantyUntil: "",
    note: "",
  });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [serials, reference] = await Promise.all([
        apiFetch<Serial[]>(`/api/v1/serial-numbers${toQuery({ pageSize: 500 })}`),
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

  useEffect(() => {
    void reload();
  }, [reload]);

  const visibleRows = useMemo(() => {
    let list = filterSerials(rows, products, query, statusFilter);
    if (warehouseFilter) {
      list = list.filter((r) => r.warehouseId === warehouseFilter);
    }
    return list;
  }, [products, query, rows, statusFilter, warehouseFilter]);

  const sorted = useMemo(() => {
    if (!sortKey) return visibleRows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...visibleRows].sort((a, b) => {
      if (sortKey === "product") {
        const prodA = products.find((p) => p.id === a.productId)?.name ?? "";
        const prodB = products.find((p) => p.id === b.productId)?.name ?? "";
        return prodA.localeCompare(prodB, "vi") * dir;
      }
      if (sortKey === "warehouse") {
        const whA = warehouses.find((w) => w.id === a.warehouseId)?.name ?? "";
        const whB = warehouses.find((w) => w.id === b.warehouseId)?.name ?? "";
        return whA.localeCompare(whB, "vi") * dir;
      }
      const av = String((a as Record<string, unknown>)[sortKey] ?? "");
      const bv = String((b as Record<string, unknown>)[sortKey] ?? "");
      return av.localeCompare(bv, "vi") * dir;
    });
  }, [visibleRows, sortKey, sortDir, products, warehouses]);

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

  function beginCreate() {
    setEditing(null);
    setForm({
      productId: "",
      serial: "",
      warehouseId: "",
      status: "in_stock",
      warrantyUntil: "",
      note: "",
    });
    setOpen(true);
  }

  function beginEdit(row: Serial) {
    setEditing(row);
    setForm({
      productId: row.productId,
      serial: row.serial,
      warehouseId: row.warehouseId ?? "",
      status: row.status,
      warrantyUntil: row.warrantyUntil?.slice(0, 10) ?? "",
      note: row.note ?? "",
    });
    setOpen(true);
  }

  async function save() {
    if (!form.productId || !form.serial.trim()) return toast("Chọn sản phẩm và nhập serial", "error");
    setSaving(true);
    try {
      const payload = {
        ...form,
        warehouseId: form.warehouseId || undefined,
        warrantyUntil: form.warrantyUntil || undefined,
        note: form.note || undefined,
      };
      await apiFetch(editing ? `/api/v1/serial-numbers/${editing.id}` : "/api/v1/serial-numbers", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(
          editing
            ? {
                warehouseId: payload.warehouseId,
                status: payload.status,
                warrantyUntil: payload.warrantyUntil,
                note: payload.note,
              }
            : payload
        ),
      });
      toast(editing ? "Đã cập nhật serial" : "Đã thêm serial", "success");
      setOpen(false);
      await reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể lưu serial", "error");
    } finally {
      setSaving(false);
    }
  }

  const allColumns: DataGridColumn<Serial>[] = [
    {
      id: "serial",
      header: "Serial",
      width: "w-36",
      sortable: true,
      cell: (r) => <span className="font-mono text-xs font-semibold text-foreground/90">{r.serial}</span>,
    },
    {
      id: "product",
      header: "Sản phẩm",
      sortable: true,
      cell: (r) => (
        <span className="font-medium text-foreground">
          {products.find((p) => p.id === r.productId)?.name ?? "—"}
        </span>
      ),
    },
    {
      id: "warehouse",
      header: "Kho",
      sortable: true,
      cell: (r) => warehouses.find((w) => w.id === r.warehouseId)?.name ?? "—",
    },
    {
      id: "status",
      header: "Trạng thái",
      width: "w-36",
      cell: (r) => {
        const config = SERIAL_STATUS_CONFIG[r.status] ?? { label: r.status, color: "gray" };
        return <StatusDot color={config.color} label={config.label} />;
      },
    },
    {
      id: "warrantyUntil",
      header: "Hết hạn bảo hành",
      width: "w-36",
      sortable: true,
      cell: (r) => <span className="text-muted text-xs">{formatDate(r.warrantyUntil)}</span>,
    },
    {
      id: "note",
      header: "Ghi chú",
      cell: (r) => <span className="text-muted">{r.note || "—"}</span>,
    },
    {
      id: "actions",
      header: "Thao tác",
      sticky: "right",
      width: "w-20",
      cell: (r) =>
        canEdit("inventory") ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted hover:text-foreground"
            title="Cập nhật serial"
            onClick={() => beginEdit(r)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ) : null,
    },
  ];

  const columns = allColumns.filter((c) => visibleColumns.includes(c.id));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader
        moduleLabel="Serial & bảo hành"
        onCreate={canCreate("inventory") ? beginCreate : undefined}
        createLabel="Thêm serial"
      />

      <FilterBar
        filters={
          <>
            <Input
              className="w-60"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm serial hoặc sản phẩm..."
            />
            <Select
              className="w-40"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Trạng thái</option>
              {Object.entries(SERIAL_STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </Select>
            <Select
              className="w-44"
              value={warehouseFilter}
              onChange={(event) => {
                setWarehouseFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Kho</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
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
              columns={SERIAL_COLUMN_DEFS}
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
            icon={ScanLine}
            title="Chưa có serial"
            description="Thêm serial để tra cứu trạng thái, vị trí kho và thời hạn bảo hành."
            action={
              canCreate("inventory") ? (
                <Button variant="primary" onClick={beginCreate}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Thêm serial
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
        title={editing ? "Cập nhật serial" : "Thêm serial mới"}
        footer={
          <>
            <Button variant="outline" disabled={saving} onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button disabled={saving} onClick={() => void save()}>
              {saving ? "Đang lưu..." : "Lưu serial"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <FormSelect
            label="Sản phẩm *"
            disabled={Boolean(editing)}
            value={form.productId}
            onChange={(productId) => setForm((current) => ({ ...current, productId }))}
            options={products.map((product) => ({
              value: product.id,
              label: `${product.sku} — ${product.name}`,
            }))}
          />
          <FormField
            label="Mã Serial *"
            disabled={Boolean(editing)}
            value={form.serial}
            onChange={(serial) => setForm((current) => ({ ...current, serial }))}
          />
          <FormSelect
            label="Kho lưu trữ"
            value={form.warehouseId}
            onChange={(warehouseId) => setForm((current) => ({ ...current, warehouseId }))}
            options={warehouses.map((warehouse) => ({
              value: warehouse.id,
              label: `${warehouse.code} — ${warehouse.name}`,
            }))}
          />
          <FormSelect
            label="Trạng thái"
            value={form.status}
            onChange={(status) => setForm((current) => ({ ...current, status }))}
            options={SERIAL_STATUSES}
          />
          <FormField
            label="Hết hạn bảo hành"
            type="date"
            value={form.warrantyUntil}
            onChange={(warrantyUntil) => setForm((current) => ({ ...current, warrantyUntil }))}
          />
          <FormField
            label="Ghi chú"
            value={form.note}
            onChange={(note) => setForm((current) => ({ ...current, note }))}
          />
        </div>
      </Modal>
    </div>
  );
}

export function InventoryCountsPage() {
  const { canCreate, canApprove } = useCurrentUser();
  const { toast } = useToast();
  const [rows, setRows] = useState<InventoryCount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [balances, setBalances] = useState<InventoryBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortKey, setSortKey] = useState<string>("countedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(COUNT_COLUMN_DEFS.map((c) => c.id));

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
      const [counts, reference] = await Promise.all([
        apiFetch<InventoryCount[]>(`/api/v1/inventory-counts${toQuery({ pageSize: 500 })}`),
        loadReferenceData(),
      ]);
      setRows(counts.data ?? []);
      setProducts(reference.products);
      setWarehouses(reference.warehouses);
      setBalances(reference.balances);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể tải phiếu kiểm kê", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (warehouseFilter && row.warehouseId !== warehouseFilter) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      if (!q) return true;
      const whName = warehouses.find((w) => w.id === row.warehouseId)?.name?.toLowerCase() ?? "";
      return (
        row.code.toLowerCase().includes(q) ||
        whName.includes(q) ||
        (row.note && row.note.toLowerCase().includes(q))
      );
    });
  }, [rows, query, warehouseFilter, statusFilter, warehouses]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "warehouse") {
        const whA = warehouses.find((w) => w.id === a.warehouseId)?.name ?? "";
        const whB = warehouses.find((w) => w.id === b.warehouseId)?.name ?? "";
        return whA.localeCompare(whB, "vi") * dir;
      }
      const av = String((a as Record<string, unknown>)[sortKey] ?? "");
      const bv = String((b as Record<string, unknown>)[sortKey] ?? "");
      return av.localeCompare(bv, "vi") * dir;
    });
  }, [filtered, sortKey, sortDir, warehouses]);

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

  function expectedQty(productId: string, selectedWarehouseId = warehouseId) {
    return Number(
      balances.find((balance) => balance.warehouseId === selectedWarehouseId && balance.productId === productId)
        ?.qty ?? 0
    );
  }

  function beginCreate() {
    setWarehouseId("");
    setCountedAt(new Date().toISOString().slice(0, 10));
    setNote("");
    setLines([{ productId: "", countedQty: "0" }]);
    setOpen(true);
  }

  function selectWarehouse(value: string) {
    setWarehouseId(value);
    setLines((current) =>
      current.map((line) =>
        line.productId ? { ...line, countedQty: String(expectedQty(line.productId, value)) } : line
      )
    );
  }

  function changeLine(index: number, patch: Partial<CountLine>) {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index
          ? {
              ...line,
              ...patch,
              countedQty: patch.productId ? String(expectedQty(patch.productId)) : patch.countedQty ?? line.countedQty,
            }
          : line
      )
    );
  }

  function adjustLine(index: number, change: number) {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index
          ? { ...line, countedQty: String(Math.max(0, Number(line.countedQty || 0) + change)) }
          : line
      )
    );
  }

  async function viewDetail(row: InventoryCount) {
    setDetailLoading(true);
    try {
      const result = await apiFetch<InventoryCountDetail>(`/api/v1/inventory-counts/${row.id}`);
      setViewing(result.data);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể tải chi tiết kiểm kê", "error");
    } finally {
      setDetailLoading(false);
    }
  }

  async function save() {
    if (!warehouseId || lines.some((line) => !line.productId || line.countedQty === "")) {
      return toast("Chọn kho, sản phẩm và số lượng thực tế", "error");
    }
    if (new Set(lines.map((line) => line.productId)).size !== lines.length) {
      return toast("Mỗi sản phẩm chỉ được nhập một lần", "error");
    }
    setSaving(true);
    try {
      await apiFetch("/api/v1/inventory-counts", {
        method: "POST",
        body: JSON.stringify({
          warehouseId,
          countedAt,
          note: note || undefined,
          lines: lines.map((line) => ({ productId: line.productId, countedQty: Number(line.countedQty) })),
        }),
      });
      toast("Đã tạo phiếu kiểm kê nháp", "success");
      setOpen(false);
      await reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể tạo phiếu kiểm kê", "error");
    } finally {
      setSaving(false);
    }
  }

  async function post(row: InventoryCount) {
    setPostingId(row.id);
    try {
      await apiFetch(`/api/v1/inventory-counts/${row.id}/post`, { method: "POST" });
      toast("Đã ghi sổ và cập nhật tồn kho", "success");
      await reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể ghi sổ", "error");
    } finally {
      setPostingId(null);
    }
  }

  const allColumns: DataGridColumn<InventoryCount>[] = [
    {
      id: "code",
      header: "Mã phiếu",
      width: "w-32",
      sortable: true,
      cell: (row) => <span className="font-mono text-xs font-semibold text-foreground/90">{row.code}</span>,
    },
    {
      id: "warehouse",
      header: "Kho kiểm kê",
      sortable: true,
      cell: (row) => warehouses.find((warehouse) => warehouse.id === row.warehouseId)?.name ?? "—",
    },
    {
      id: "countedAt",
      header: "Ngày kiểm",
      width: "w-32",
      sortable: true,
      cell: (row) => <span className="text-xs text-muted">{formatDate(row.countedAt)}</span>,
    },
    {
      id: "note",
      header: "Ghi chú",
      cell: (row) => <span className="text-muted">{row.note || "—"}</span>,
    },
    {
      id: "status",
      header: "Trạng thái",
      width: "w-32",
      cell: (row) => {
        const config = COUNT_STATUS_CONFIG[row.status] ?? { label: row.status, color: "gray" };
        return <StatusDot color={config.color} label={config.label} />;
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      sticky: "right",
      width: "w-28",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted hover:text-foreground"
            title="Xem chi tiết kiểm kê"
            onClick={(e) => {
              e.stopPropagation();
              void viewDetail(row);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row.status === "draft" && canApprove("inventory") ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              title={postingId === row.id ? "Đang ghi sổ..." : "Ghi sổ điều chỉnh"}
              disabled={postingId === row.id}
              onClick={(e) => {
                e.stopPropagation();
                void post(row);
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const columns = allColumns.filter((c) => visibleColumns.includes(c.id));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader
        moduleLabel="Kiểm kê kho"
        onCreate={canCreate("inventory") ? beginCreate : undefined}
        createLabel="Tạo phiếu kiểm kê"
      />

      <FilterBar
        filters={
          <>
            <Input
              className="w-56"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm mã phiếu, ghi chú..."
            />
            <Select
              className="w-44"
              value={warehouseFilter}
              onChange={(e) => {
                setWarehouseFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Kho</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
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
              {Object.entries(COUNT_STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </Select>
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
              columns={COUNT_COLUMN_DEFS}
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
        onRowClick={(row) => void viewDetail(row)}
        loading={loading}
        empty={
          <EmptyState
            icon={ClipboardCheck}
            title="Chưa có phiếu kiểm kê"
            description="Tạo phiếu, nhập số đếm thực tế rồi ghi sổ để điều chỉnh tồn kho."
            action={
              canCreate("inventory") ? (
                <Button variant="primary" onClick={beginCreate}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Tạo phiếu
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

      {/* Modal Tạo Phiếu Kiểm Kê */}
      <Modal
        open={open}
        onOpenChange={(value) => !saving && setOpen(value)}
        title="Tạo phiếu kiểm kê kho"
        description="Tồn kho được cập nhật khi người có quyền ghi sổ phiếu."
        size="xl"
        footer={
          <>
            <Button variant="outline" disabled={saving} onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button disabled={saving} onClick={() => void save()}>
              {saving ? "Đang lưu..." : "Tạo phiếu"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <FormSelect
            label="Kho kiểm kê *"
            value={warehouseId}
            onChange={selectWarehouse}
            options={warehouses.map((warehouse) => ({
              value: warehouse.id,
              label: `${warehouse.code} — ${warehouse.name}`,
            }))}
          />
          <FormField
            label="Ngày kiểm kê"
            type="date"
            value={countedAt}
            onChange={setCountedAt}
          />
        </div>
        <FormField
          label="Ghi chú"
          value={note}
          onChange={setNote}
          className="mt-3"
        />
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Số lượng kiểm kê và điều chỉnh
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLines((current) => [...current, { productId: "", countedQty: "0" }])}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Thêm dòng
            </Button>
          </div>
          {lines.map((line, index) => {
            const expected = expectedQty(line.productId);
            const difference = countDifference(expected, line.countedQty);
            return (
              <div
                key={index}
                className="grid grid-cols-[1fr_7rem_7rem_5rem_5rem_2rem] items-end gap-2"
              >
                <FormSelect
                  label={index === 0 ? "Sản phẩm *" : ""}
                  value={line.productId}
                  onChange={(productId) => changeLine(index, { productId })}
                  options={products.map((product) => ({
                    value: product.id,
                    label: `${product.sku} — ${product.name}`,
                  }))}
                />
                <label className="space-y-1 text-xs font-medium text-foreground">
                  <span className="text-muted">Tồn hệ thống</span>
                  <Input disabled value={line.productId ? String(expected) : "—"} />
                </label>
                <FormField
                  label={index === 0 ? "SL thực tế *" : ""}
                  type="number"
                  min="0"
                  value={line.countedQty}
                  onChange={(countedQty) => changeLine(index, { countedQty })}
                />
                <div className="space-y-1 text-xs">
                  <span className="text-muted">Chênh lệch</span>
                  <p
                    className={
                      difference > 0
                        ? "h-9 pt-2 font-medium text-emerald-600"
                        : difference < 0
                        ? "h-9 pt-2 font-medium text-danger"
                        : "h-9 pt-2 font-medium text-muted"
                    }
                  >
                    {line.productId ? `${difference > 0 ? "+" : ""}${difference}` : "—"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={!line.productId || Number(line.countedQty) <= 0}
                    title="Giảm tồn 1"
                    onClick={() => adjustLine(index, -1)}
                  >
                    −
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={!line.productId}
                    title="Tăng tồn 1"
                    onClick={() => adjustLine(index, 1)}
                  >
                    +
                  </Button>
                </div>
                {lines.length > 1 ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Xóa dòng"
                    onClick={() =>
                      setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))
                    }
                  >
                    ×
                  </Button>
                ) : (
                  <span />
                )}
              </div>
            );
          })}
        </div>
      </Modal>

      {/* Modal Xem Chi Tiết Kiểm Kê */}
      <Modal
        open={Boolean(viewing)}
        onOpenChange={(value) => !value && setViewing(null)}
        title={viewing ? `Chi tiết kiểm kê ${viewing.code}` : "Chi tiết kiểm kê"}
        size="xl"
        footer={
          <Button variant="outline" onClick={() => setViewing(null)}>
            Đóng
          </Button>
        }
      >
        {viewing ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              {warehouses.find((warehouse) => warehouse.id === viewing.warehouseId)?.name ?? "—"} ·{" "}
              {formatDate(viewing.countedAt)}
              {viewing.note ? ` · ${viewing.note}` : ""}
            </p>
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs text-muted">
                <tr>
                  <th className="p-2">Sản phẩm</th>
                  <th className="p-2 text-right">Tồn hệ thống</th>
                  <th className="p-2 text-right">Thực tế</th>
                  <th className="p-2 text-right">Chênh lệch</th>
                </tr>
              </thead>
              <tbody>
                {viewing.lines.map((line) => {
                  const difference = countDifference(line.expectedQty, line.countedQty);
                  return (
                    <tr key={line.id} className="border-b border-border/70">
                      <td className="p-2">
                        {line.sku} — {line.productName}
                      </td>
                      <td className="p-2 text-right">{line.expectedQty}</td>
                      <td className="p-2 text-right">{line.countedQty}</td>
                      <td
                        className={
                          difference > 0
                            ? "p-2 text-right font-medium text-emerald-600"
                            : difference < 0
                            ? "p-2 text-right font-medium text-danger"
                            : "p-2 text-right font-medium text-muted"
                        }
                      >
                        {difference > 0 ? "+" : ""}
                        {difference}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}


const SERIAL_STATUSES = [
  { value: "in_stock", label: "Trong kho" }, { value: "installed", label: "Đã lắp đặt" }, { value: "warranty", label: "Đang bảo hành" }, { value: "damaged", label: "Hư hỏng" }, { value: "returned", label: "Đã trả" },
];
function serialStatusLabel(status: string) { return SERIAL_STATUSES.find((item) => item.value === status)?.label ?? status; }
function FormField({ label, value, onChange, type = "text", className, ...props }: { label: string; value: string; onChange: (value: string) => void; type?: string; className?: string } & Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type">) { return <label className={`space-y-1 text-xs ${className ?? ""}`}><span className="text-muted">{label}</span><Input type={type} value={value} onChange={(event) => onChange(event.target.value)} {...props} /></label>; }
function FormSelect({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; disabled?: boolean }) { return <label className="space-y-1 text-xs"><span className="text-muted">{label}</span><Select className="w-full" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}><option value="">Chọn</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></label>; }
