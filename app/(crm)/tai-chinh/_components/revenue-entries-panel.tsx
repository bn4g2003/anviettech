"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useOwners } from "@/features/shared/api/owners";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatVnd } from "@/features/shared/utils/money";
import { formatDate } from "@/features/shared/utils/date";
import { apiFetch, toQuery } from "@/lib/api-client";
import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { FilterBar } from "@/components/datagrid/filter-bar";
import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { Pagination } from "@/components/datagrid/pagination";
import { StatusDot } from "@/components/ui/status-dot";
import { RefreshCw, Plus, Percent, HandCoins, FileSpreadsheet } from "lucide-react";

type Ref = { id: string; name: string; code?: string; sku?: string; customerId?: string };

type Entry = {
  id: string;
  code: string;
  occurredAt: string;
  customerId: string;
  customerName?: string;
  projectId?: string | null;
  productId: string;
  employeeId?: string | null;
  invoiceId?: string | null;
  businessType: string;
  totalAmount: number | string;
  costAmount: number | string;
  paymentStatus: string;
  paidAmount: number | string;
};

type Reduction = { id: string; revenueEntryId?: string | null; amount: number | string };

const TYPES: Record<string, string> = {
  new_construction: "Công trình mới",
  repair: "Sửa chữa",
  warranty: "Bảo hành",
  retail: "Bán buôn / bán lẻ",
};

const REDUCTION_TYPES: Record<string, string> = {
  discount: "Chiết khấu",
  return: "Hàng trả lại",
  other: "Khác",
};

const COLUMN_DEFS = [
  { id: "code", label: "Mã PS" },
  { id: "occurredAt", label: "Ngày" },
  { id: "customer", label: "Khách hàng" },
  { id: "product", label: "Hàng hóa / DV" },
  { id: "employee", label: "Nhân viên" },
  { id: "businessType", label: "Nghiệp vụ" },
  { id: "totalAmount", label: "Tổng thu" },
  { id: "paidAmount", label: "Đã thu" },
  { id: "paymentStatus", label: "Thanh toán" },
  { id: "actions", label: "Thao tác" },
];

const today = () => new Date().toISOString().slice(0, 10);

export function RevenueEntriesPanel() {
  const { toast } = useToast();
  const { canCreate, canEdit } = useCurrentUser();
  const list = useListPage();
  const owners = useOwners();

  const [rows, setRows] = useState<Entry[]>([]);
  const [reductions, setReductions] = useState<Reduction[]>([]);
  const [customers, setCustomers] = useState<Ref[]>([]);
  const [products, setProducts] = useState<Ref[]>([]);
  const [projects, setProjects] = useState<Ref[]>([]);
  const [invoices, setInvoices] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [reductionOpen, setReductionOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activePaymentEntry, setActivePaymentEntry] = useState<Entry | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState("");

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    customerId: "",
    employeeId: "",
    projectId: "",
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortKey, setSortKey] = useState<string>("occurredAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(COLUMN_DEFS.map((c) => c.id));

  const [form, setForm] = useState(blankForm);
  const [reduction, setReduction] = useState(blankReduction);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [entries, rs, cs, ps, prs, invs] = await Promise.all([
        apiFetch<Entry[]>(`/api/v1/revenue-entries${toQuery({ pageSize: 1000 })}`),
        apiFetch<Reduction[]>(`/api/v1/revenue-reductions${toQuery({ pageSize: 1000 })}`),
        apiFetch<Ref[]>(`/api/v1/customers${toQuery({ pageSize: 1000, status: "active" })}`),
        apiFetch<Ref[]>(`/api/v1/products${toQuery({ pageSize: 1000, status: "active" })}`),
        apiFetch<Ref[]>(`/api/v1/projects${toQuery({ pageSize: 1000 })}`),
        apiFetch<Array<{ id: string; code: string; customerId: string; status: string }>>(
          `/api/v1/invoices${toQuery({ pageSize: 1000 })}`
        ),
      ]);
      setRows(entries.data ?? []);
      setReductions(rs.data ?? []);
      setCustomers(cs.data ?? []);
      setProducts(ps.data ?? []);
      setProjects(prs.data ?? []);
      setInvoices(
        (invs.data ?? []).filter((x) => x.status !== "cancelled").map((x) => ({ ...x, name: x.code }))
      );
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể tải chi tiết doanh thu", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filters.from && row.occurredAt < filters.from) return false;
      if (filters.to && row.occurredAt > filters.to) return false;
      if (filters.customerId && row.customerId !== filters.customerId) return false;
      if (filters.employeeId && row.employeeId !== filters.employeeId) return false;
      if (filters.projectId && row.projectId !== filters.projectId) return false;
      if (!q) return true;
      const custName = (row.customerName || findName(customers, row.customerId)).toLowerCase();
      const prodName = findName(products, row.productId).toLowerCase();
      return (
        row.code.toLowerCase().includes(q) ||
        custName.includes(q) ||
        prodName.includes(q)
      );
    });
  }, [rows, filters, query, customers, products]);

  const summary = useMemo(
    () =>
      visibleRows.reduce(
        (total, row) => {
          const reduced = reductions
            .filter((x) => x.revenueEntryId === row.id)
            .reduce((sum, x) => sum + Number(x.amount), 0);
          total.revenue += Number(row.totalAmount) - reduced;
          total.cogs += Number(row.costAmount);
          total.debt += Number(row.totalAmount) - Number(row.paidAmount);
          return total;
        },
        { revenue: 0, cogs: 0, debt: 0 }
      ),
    [visibleRows, reductions]
  );

  const sorted = useMemo(() => {
    if (!sortKey) return visibleRows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...visibleRows].sort((a, b) => {
      if (sortKey === "totalAmount" || sortKey === "paidAmount") {
        return (Number(a[sortKey]) - Number(b[sortKey])) * dir;
      }
      const av = String((a as Record<string, unknown>)[sortKey] ?? "");
      const bv = String((b as Record<string, unknown>)[sortKey] ?? "");
      return av.localeCompare(bv, "vi") * dir;
    });
  }, [visibleRows, sortKey, sortDir]);

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

  const selectedProjects = projects.filter((x) => !form.customerId || x.customerId === form.customerId);
  const selectedInvoices = invoices.filter((x) => !form.customerId || x.customerId === form.customerId);

  const change = (key: string, value: string) => setForm((old) => ({ ...old, [key]: value }));

  async function save() {
    if (!form.customerId || !form.productId || Number(form.qty) <= 0 || Number(form.unitPrice) < 0) {
      return toast("Chọn khách hàng, hàng hóa/dịch vụ và nhập số liệu hợp lệ", "error");
    }
    setSaving(true);
    try {
      await apiFetch("/api/v1/revenue-entries", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          projectId: form.projectId || undefined,
          employeeId: form.employeeId || undefined,
          invoiceId: form.invoiceId || undefined,
          documentCode: form.documentCode || undefined,
          qty: Number(form.qty),
          unitPrice: Number(form.unitPrice),
          vatPercent: Number(form.vatPercent),
          costAmount: Number(form.costAmount),
          paidAmount: Number(form.paidAmount),
          note: form.note || undefined,
        }),
      });
      toast("Đã ghi chi tiết doanh thu", "success");
      list.setCreateOpen(false);
      await reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể ghi doanh thu", "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveReduction() {
    if (Number(reduction.amount) <= 0) return toast("Nhập số tiền giảm trừ lớn hơn 0", "error");
    setSaving(true);
    try {
      await apiFetch("/api/v1/revenue-reductions", {
        method: "POST",
        body: JSON.stringify({
          ...reduction,
          amount: Number(reduction.amount),
          note: reduction.note || undefined,
        }),
      });
      toast("Đã ghi khoản giảm trừ", "success");
      setReductionOpen(false);
      await reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể ghi giảm trừ", "error");
    } finally {
      setSaving(false);
    }
  }

  function openPaymentModal(row: Entry) {
    setActivePaymentEntry(row);
    setPaymentAmountInput(String(row.paidAmount));
    setPaymentModalOpen(true);
  }

  async function handleConfirmPayment() {
    if (!activePaymentEntry) return;
    const paidAmount = Number(paymentAmountInput);
    if (!Number.isFinite(paidAmount) || paidAmount < 0) {
      return toast("Số tiền thanh toán không hợp lệ", "error");
    }
    setSaving(true);
    try {
      await apiFetch(`/api/v1/revenue-entries/${activePaymentEntry.id}/payment`, {
        method: "PATCH",
        body: JSON.stringify({ paidAmount }),
      });
      toast("Đã cập nhật số tiền thanh toán", "success");
      setPaymentModalOpen(false);
      await reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể cập nhật thanh toán", "error");
    } finally {
      setSaving(false);
    }
  }

  const allColumns: DataGridColumn<Entry>[] = [
    {
      id: "code",
      header: "Mã PS",
      width: "w-28",
      sortable: true,
      cell: (r) => <span className="font-mono text-xs font-semibold text-foreground/90">{r.code}</span>,
    },
    {
      id: "occurredAt",
      header: "Ngày",
      width: "w-28",
      sortable: true,
      cell: (r) => <span className="text-xs text-muted">{formatDate(r.occurredAt)}</span>,
    },
    {
      id: "customer",
      header: "Khách hàng",
      sortable: true,
      cell: (r) => (
        <span className="font-medium text-foreground">
          {r.customerName || findName(customers, r.customerId)}
        </span>
      ),
    },
    {
      id: "product",
      header: "Hàng hóa / DV",
      sortable: true,
      cell: (r) => <span className="text-foreground/90">{findName(products, r.productId)}</span>,
    },
    {
      id: "employee",
      header: "Nhân viên",
      cell: (r) => {
        const empName = owners.find((x) => x.id === r.employeeId)?.name ?? "—";
        return <span className="text-xs text-muted">{empName}</span>;
      },
    },
    {
      id: "businessType",
      header: "Nghiệp vụ",
      width: "w-36",
      cell: (r) => (
        <span className="inline-flex items-center rounded-md bg-surface-raised px-2 py-0.5 text-xs text-muted">
          {TYPES[r.businessType] ?? r.businessType}
        </span>
      ),
    },
    {
      id: "totalAmount",
      header: "Tổng thu",
      width: "w-36",
      sortable: true,
      cell: (r) => (
        <span className="font-semibold text-foreground whitespace-nowrap">
          {formatVnd(Number(r.totalAmount))}
        </span>
      ),
    },
    {
      id: "paidAmount",
      header: "Đã thu",
      width: "w-32",
      sortable: true,
      cell: (r) => (
        <span className="text-xs font-medium text-muted whitespace-nowrap">
          {formatVnd(Number(r.paidAmount))}
        </span>
      ),
    },
    {
      id: "paymentStatus",
      header: "Thanh toán",
      width: "w-36",
      cell: (r) => {
        const statusMap: Record<string, { label: string; color: string }> = {
          unpaid: { label: "Chưa thanh toán", color: "red" },
          partial: { label: "Một phần", color: "orange" },
          paid: { label: "Đã thanh toán", color: "green" },
        };
        const config = statusMap[r.paymentStatus] ?? { label: r.paymentStatus, color: "gray" };
        return <StatusDot color={config.color} label={config.label} />;
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      sticky: "right",
      width: "w-28",
      cell: (r) => (
        <div className="flex items-center gap-1">
          {canCreate("finance") ? (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
              title="Ghi giảm trừ doanh thu"
              onClick={(e) => {
                e.stopPropagation();
                setReduction({
                  ...blankReduction(),
                  customerId: r.customerId,
                  revenueEntryId: r.id,
                });
                setReductionOpen(true);
              }}
            >
              <Percent className="h-4 w-4" />
            </Button>
          ) : null}
          {!r.invoiceId && canEdit("finance", r.employeeId) ? (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              title="Cập nhật số tiền đã thu"
              onClick={(e) => {
                e.stopPropagation();
                openPaymentModal(r);
              }}
            >
              <HandCoins className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const columns = allColumns.filter((c) => visibleColumns.includes(c.id));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <FilterBar
        filters={
          <>
            <Input
              className="w-48"
              placeholder="Tìm mã, khách, hàng..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
            <Input
              className="w-36"
              type="date"
              value={filters.from}
              aria-label="Từ ngày"
              onChange={(e) => {
                setFilters((x) => ({ ...x, from: e.target.value }));
                setPage(1);
              }}
            />
            <Input
              className="w-36"
              type="date"
              value={filters.to}
              aria-label="Đến ngày"
              onChange={(e) => {
                setFilters((x) => ({ ...x, to: e.target.value }));
                setPage(1);
              }}
            />
            <FilterSelect
              label="Khách hàng"
              value={filters.customerId}
              rows={customers}
              onChange={(customerId) => {
                setFilters((x) => ({ ...x, customerId }));
                setPage(1);
              }}
            />
            <FilterSelect
              label="Nhân viên"
              value={filters.employeeId}
              rows={owners}
              onChange={(employeeId) => {
                setFilters((x) => ({ ...x, employeeId }));
                setPage(1);
              }}
            />
            <FilterSelect
              label="Công trình"
              value={filters.projectId}
              rows={projects}
              onChange={(projectId) => {
                setFilters((x) => ({ ...x, projectId }));
                setPage(1);
              }}
            />
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
              columns={COLUMN_DEFS}
              visibleIds={visibleColumns}
              onChange={setVisibleColumns}
            />
            {canCreate("finance") ? (
              <Button
                size="sm"
                onClick={() => {
                  setForm(blankForm());
                  list.setCreateOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ghi doanh thu
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 border-b border-border bg-surface-raised/30 px-5 py-3 sm:grid-cols-3">
        <Summary label="Doanh thu sau giảm trừ" value={summary.revenue} tone="primary" />
        <Summary label="Giá vốn phát sinh" value={summary.cogs} tone="muted" />
        <Summary label="Công nợ còn lại" value={summary.debt} tone="danger" />
      </div>

      <DataGrid
        columns={columns}
        rows={paginated}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={toggleSort}
        loading={loading}
        empty={
          <EmptyState
            icon={FileSpreadsheet}
            title="Chưa có phát sinh doanh thu"
            description="Ghi từng hàng hóa hoặc dịch vụ phát sinh để tổng hợp tài chính chính xác."
            action={
              canCreate("finance") ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    setForm(blankForm());
                    list.setCreateOpen(true);
                  }}
                >
                  Ghi doanh thu
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

      {/* Modal Ghi Chi Tiết Doanh Thu */}
      <Modal
        open={list.createOpen}
        onOpenChange={(value) => !saving && list.setCreateOpen(value)}
        title="Ghi chi tiết doanh thu phát sinh"
        size="xl"
        footer={
          <>
            <Button variant="outline" disabled={saving} onClick={() => list.setCreateOpen(false)}>
              Hủy
            </Button>
            <Button disabled={saving} onClick={() => void save()}>
              {saving ? "Đang lưu..." : "Lưu doanh thu"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Ngày phát sinh *"
            type="date"
            value={form.occurredAt}
            onChange={(v) => change("occurredAt", v)}
          />
          <FormSelect
            label="Khách hàng *"
            value={form.customerId}
            rows={customers}
            onChange={(customerId) =>
              setForm((x) => ({ ...x, customerId, projectId: "", invoiceId: "" }))
            }
          />
          <FormSelect
            label="Hóa đơn liên kết"
            value={form.invoiceId}
            rows={selectedInvoices}
            onChange={(v) => change("invoiceId", v)}
          />
          <FormSelect
            label="Công trình"
            value={form.projectId}
            rows={selectedProjects}
            onChange={(v) => change("projectId", v)}
          />
          <FormSelect
            label="Hàng hóa / dịch vụ *"
            value={form.productId}
            rows={products}
            onChange={(v) => change("productId", v)}
          />
          <FormSelect
            label="Nhân viên phụ trách"
            value={form.employeeId}
            rows={owners}
            onChange={(v) => change("employeeId", v)}
          />
          <Field
            label="Mã phiếu / chứng từ"
            value={form.documentCode}
            onChange={(v) => change("documentCode", v)}
          />
          <Choice
            label="Loại nghiệp vụ"
            value={form.businessType}
            rows={TYPES}
            onChange={(v) => change("businessType", v)}
          />
          <Field
            label="Số lượng *"
            type="number"
            value={form.qty}
            onChange={(v) => change("qty", v)}
          />
          <Field
            label="Đơn giá (VNĐ) *"
            type="number"
            value={form.unitPrice}
            onChange={(v) => change("unitPrice", v)}
          />
          <Field
            label="VAT (%)"
            type="number"
            value={form.vatPercent}
            onChange={(v) => change("vatPercent", v)}
          />
          <Field
            label="Giá vốn (VNĐ)"
            type="number"
            value={form.costAmount}
            onChange={(v) => change("costAmount", v)}
          />
          <Choice
            label="Trạng thái thanh toán"
            value={form.paymentStatus}
            rows={{
              unpaid: "Chưa thanh toán",
              partial: "Một phần",
              paid: "Đã thanh toán",
            }}
            onChange={(v) => change("paymentStatus", v)}
          />
          <Field
            label="Đã thanh toán (VNĐ)"
            type="number"
            value={form.paidAmount}
            onChange={(v) => change("paidAmount", v)}
          />
          <div className="col-span-2">
            <Field
              label="Ghi chú"
              value={form.note}
              onChange={(v) => change("note", v)}
            />
          </div>
        </div>
      </Modal>

      {/* Modal Giảm Trừ Doanh Thu */}
      <Modal
        open={reductionOpen}
        onOpenChange={(value) => !saving && setReductionOpen(value)}
        title="Ghi giảm trừ doanh thu"
        footer={
          <>
            <Button variant="outline" disabled={saving} onClick={() => setReductionOpen(false)}>
              Hủy
            </Button>
            <Button disabled={saving} onClick={() => void saveReduction()}>
              {saving ? "Đang lưu..." : "Lưu giảm trừ"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field
            label="Ngày phát sinh *"
            type="date"
            value={reduction.occurredAt}
            onChange={(occurredAt) => setReduction((x) => ({ ...x, occurredAt }))}
          />
          <Choice
            label="Loại giảm trừ *"
            value={reduction.type}
            rows={REDUCTION_TYPES}
            onChange={(type) => setReduction((x) => ({ ...x, type }))}
          />
          <Field
            label="Số tiền giảm trừ (VNĐ) *"
            type="number"
            value={reduction.amount}
            onChange={(amount) => setReduction((x) => ({ ...x, amount }))}
          />
          <Field
            label="Ghi chú lý do"
            value={reduction.note}
            onChange={(note) => setReduction((x) => ({ ...x, note }))}
          />
        </div>
      </Modal>

      {/* Modal Cập Nhật Thanh Toán (Thay thế window.prompt) */}
      <Modal
        open={paymentModalOpen}
        onOpenChange={(value) => !saving && setPaymentModalOpen(value)}
        title="Cập nhật số tiền đã thu"
        footer={
          <>
            <Button variant="outline" disabled={saving} onClick={() => setPaymentModalOpen(false)}>
              Hủy
            </Button>
            <Button disabled={saving} onClick={() => void handleConfirmPayment()}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-muted">
            Cập nhật tổng số tiền khách hàng đã thanh toán cho phát sinh{" "}
            <strong className="font-mono text-foreground">{activePaymentEntry?.code}</strong>.
          </p>
          <div className="rounded-md border border-border bg-surface-raised/40 p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted">Tổng giá trị phát sinh:</span>
              <span className="font-semibold text-foreground">
                {formatVnd(Number(activePaymentEntry?.totalAmount ?? 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Đang ghi nhận đã thu:</span>
              <span className="font-medium text-emerald-600">
                {formatVnd(Number(activePaymentEntry?.paidAmount ?? 0))}
              </span>
            </div>
          </div>
          <label className="block text-xs font-medium text-foreground">
            <span>Tổng số tiền thực thu (VNĐ) *</span>
            <Input
              className="mt-1 w-full"
              type="number"
              min="0"
              value={paymentAmountInput}
              onChange={(e) => setPaymentAmountInput(e.target.value)}
            />
          </label>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPaymentAmountInput(String(activePaymentEntry?.totalAmount ?? 0))}
            >
              Thu đủ 100%
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPaymentAmountInput("0")}
            >
              Về 0 VNĐ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function blankForm() {
  return {
    occurredAt: today(),
    customerId: "",
    projectId: "",
    productId: "",
    employeeId: "",
    invoiceId: "",
    documentCode: "",
    businessType: "retail",
    qty: "1",
    unitPrice: "",
    vatPercent: "0",
    costAmount: "0",
    paymentStatus: "unpaid",
    paidAmount: "0",
    note: "",
  };
}

function blankReduction() {
  return {
    occurredAt: today(),
    customerId: "",
    revenueEntryId: "",
    type: "discount",
    amount: "",
    note: "",
  };
}

function findName(rows: Ref[], id: string) {
  return rows.find((x) => x.id === id)?.name ?? "—";
}

function Summary({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: number;
  tone?: "primary" | "danger" | "muted";
}) {
  const textColor =
    tone === "danger"
      ? "text-danger"
      : tone === "muted"
      ? "text-muted"
      : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-white p-3 shadow-xs">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-base font-semibold ${textColor}`}>{formatVnd(value)}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="space-y-1 text-xs font-medium text-foreground">
      <span>{label}</span>
      <Input
        className="mt-1 w-full"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function FormSelect({
  label,
  value,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  rows: Array<Ref | { id: string; name: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 text-xs font-medium text-foreground">
      <span>{label}</span>
      <Select className="mt-1 w-full" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Chọn</option>
        {rows.map((row) => (
          <option key={row.id} value={row.id}>
            {("code" in row ? row.code : undefined) ?? ("sku" in row ? row.sku : undefined)
              ? `${("code" in row ? row.code : undefined) ?? ("sku" in row ? row.sku : undefined)} — `
              : ""}
            {row.name}
          </option>
        ))}
      </Select>
    </label>
  );
}

function FilterSelect({
  value,
  label,
  rows,
  onChange,
}: {
  value: string;
  label: string;
  rows: Array<Ref | { id: string; name: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      className="w-36 max-w-[150px] truncate text-xs"
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{label}</option>
      {rows.map((row) => (
        <option key={row.id} value={row.id}>
          {"code" in row && row.code ? `${row.code} — ${row.name}` : row.name}
        </option>
      ))}
    </Select>
  );
}

function Choice({
  label,
  value,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  rows: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 text-xs font-medium text-foreground">
      <span>{label}</span>
      <Select className="mt-1 w-full" value={value} onChange={(e) => onChange(e.target.value)}>
        {Object.entries(rows).map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </Select>
    </label>
  );
}

