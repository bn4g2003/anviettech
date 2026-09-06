"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ReceiptText, RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { formatVnd } from "@/features/shared/utils/money";
import { formatDate } from "@/features/shared/utils/date";
import { apiFetch, toQuery } from "@/lib/api-client";
import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { FilterBar } from "@/components/datagrid/filter-bar";
import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { Pagination } from "@/components/datagrid/pagination";

type Expense = {
  id: string;
  code: string;
  category: keyof typeof CATEGORY_LABEL;
  amount: number | string;
  expenseDate: string;
  note?: string | null;
};

const CATEGORY_LABEL = {
  salary: "Tiền lương",
  insurance: "Bảo hiểm",
  office_rent: "Thuê văn phòng",
  tax: "Thuế",
  management: "Quản lý doanh nghiệp",
  tech_dept: "Phòng kỹ thuật",
  other: "Khác",
} as const;

const COLUMN_DEFS = [
  { id: "code", label: "Mã CP" },
  { id: "category", label: "Nhóm chi phí" },
  { id: "expenseDate", label: "Ngày phát sinh" },
  { id: "amount", label: "Số tiền" },
  { id: "note", label: "Ghi chú" },
];

export function OperatingExpensesPanel() {
  const { canCreate } = useCurrentUser();
  const { toast } = useToast();

  const [rows, setRows] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortKey, setSortKey] = useState<string>("expenseDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(COLUMN_DEFS.map((c) => c.id));

  const [form, setForm] = useState({
    category: "other" as keyof typeof CATEGORY_LABEL,
    amount: "",
    expenseDate: new Date().toISOString().slice(0, 10),
    note: "",
  });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFetch<Expense[]>(`/api/v1/operating-expenses${toQuery({ pageSize: 500 })}`);
      setRows(result.data ?? []);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể tải chi phí", "error");
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
      if (categoryFilter && row.category !== categoryFilter) return false;
      if (fromDate && row.expenseDate < fromDate) return false;
      if (toDate && row.expenseDate > toDate) return false;
      if (!q) return true;
      return (
        row.code.toLowerCase().includes(q) ||
        (row.note && row.note.toLowerCase().includes(q)) ||
        (CATEGORY_LABEL[row.category] && CATEGORY_LABEL[row.category].toLowerCase().includes(q))
      );
    });
  }, [rows, query, categoryFilter, fromDate, toDate]);

  const total = useMemo(() => filtered.reduce((sum, row) => sum + Number(row.amount), 0), [filtered]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "amount") {
        return (Number(a.amount) - Number(b.amount)) * dir;
      }
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
    setForm({
      category: "other",
      amount: "",
      expenseDate: new Date().toISOString().slice(0, 10),
      note: "",
    });
    setCreateOpen(true);
  }

  async function save() {
    if (!form.amount || Number(form.amount) <= 0) {
      return toast("Vui lòng nhập số tiền chi phí lớn hơn 0", "error");
    }
    setSaving(true);
    try {
      await apiFetch("/api/v1/operating-expenses", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          note: form.note || undefined,
        }),
      });
      toast("Đã ghi nhận chi phí thành công", "success");
      setCreateOpen(false);
      await reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể ghi nhận chi phí", "error");
    } finally {
      setSaving(false);
    }
  }

  const allColumns: DataGridColumn<Expense>[] = [
    {
      id: "code",
      header: "Mã CP",
      width: "w-28",
      sortable: true,
      cell: (r) => <span className="font-mono text-xs font-semibold text-foreground/90">{r.code}</span>,
    },
    {
      id: "category",
      header: "Nhóm chi phí",
      width: "w-48",
      sortable: true,
      cell: (r) => (
        <span className="inline-flex items-center rounded-md bg-surface-raised px-2 py-0.5 text-xs font-medium text-foreground">
          {CATEGORY_LABEL[r.category] ?? r.category}
        </span>
      ),
    },
    {
      id: "expenseDate",
      header: "Ngày phát sinh",
      width: "w-36",
      sortable: true,
      cell: (r) => <span className="text-xs text-muted">{formatDate(r.expenseDate)}</span>,
    },
    {
      id: "amount",
      header: "Số tiền",
      width: "w-40",
      sortable: true,
      cell: (r) => (
        <span className="font-semibold text-danger whitespace-nowrap">
          {formatVnd(Number(r.amount))}
        </span>
      ),
    },
    {
      id: "note",
      header: "Ghi chú",
      cell: (r) => <span className="text-muted">{r.note || "—"}</span>,
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
              placeholder="Tìm mã, ghi chú..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
            <Select
              className="w-44"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Nhóm chi phí</option>
              {Object.entries(CATEGORY_LABEL).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </Select>
            <Input
              type="date"
              className="w-36"
              aria-label="Từ ngày"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
            />
            <Input
              type="date"
              className="w-36"
              aria-label="Đến ngày"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
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
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ghi chi phí
              </Button>
            ) : null}
          </>
        }
      />

      <div className="flex items-center justify-between border-b border-border bg-surface-raised/40 px-5 py-2 text-xs text-muted">
        <div className="flex items-center gap-6">
          <span>
            Tổng chi phí lọc:{" "}
            <strong className="text-sm font-semibold text-danger">{formatVnd(total)}</strong>
          </span>
          <span>
            Số khoản chi: <strong className="text-foreground">{filtered.length}</strong>
          </span>
        </div>
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
            icon={ReceiptText}
            title="Chưa có chi phí vận hành"
            description="Ghi nhận chi phí để theo dõi tình hình chi tiêu thực tế của doanh nghiệp."
            action={
              canCreate("finance") ? (
                <Button variant="primary" onClick={openCreate}>
                  Ghi nhận chi phí
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
        open={createOpen}
        onOpenChange={(value) => !saving && setCreateOpen(value)}
        title="Ghi nhận chi phí vận hành"
        footer={
          <>
            <Button variant="outline" disabled={saving} onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button disabled={saving} onClick={() => void save()}>
              {saving ? "Đang lưu..." : "Lưu chi phí"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs font-medium text-foreground">
            <span>Nhóm chi phí *</span>
            <Select
              className="mt-1 w-full"
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  category: event.target.value as keyof typeof CATEGORY_LABEL,
                }))
              }
            >
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-xs font-medium text-foreground">
            <span>Ngày phát sinh *</span>
            <Input
              className="mt-1 w-full"
              type="date"
              value={form.expenseDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, expenseDate: event.target.value }))
              }
            />
          </label>
          <label className="col-span-2 space-y-1 text-xs font-medium text-foreground">
            <span>Số tiền (VNĐ) *</span>
            <Input
              className="mt-1 w-full"
              type="number"
              min="1"
              value={form.amount}
              onChange={(event) =>
                setForm((current) => ({ ...current, amount: event.target.value }))
              }
              placeholder="VD: 1500000"
            />
          </label>
          <label className="col-span-2 space-y-1 text-xs font-medium text-foreground">
            <span>Ghi chú nội dung</span>
            <Input
              className="mt-1 w-full"
              value={form.note}
              onChange={(event) =>
                setForm((current) => ({ ...current, note: event.target.value }))
              }
              placeholder="Chi tiết khoản chi..."
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}

