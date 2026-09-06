"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/shell/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { OwnerLookup } from "@/components/lookups/owner-lookup";
import { useToast } from "@/components/ui/toast";
import { apiFetch, toQuery, ApiClientError } from "@/lib/api-client";
import { useOwners, ownerByIdSync } from "@/features/shared/api/owners";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { LEAD_SOURCE_OPTIONS } from "@/features/leads/source-options";
import { DataGrid, type DataGridColumn } from "@/components/datagrid/data-grid";
import { FilterBar } from "@/components/datagrid/filter-bar";
import { ColumnToggle } from "@/components/datagrid/column-toggle";
import { Pagination } from "@/components/datagrid/pagination";
import { StatusDot } from "@/components/ui/status-dot";
import { CheckCircle2, XCircle, UserCheck, RefreshCw, Target } from "lucide-react";
import { relativeTime } from "@/features/shared/utils/date";

type Lead = {
  id: string;
  code: string;
  name: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  status: string;
  ownerId?: string | null;
  createdAt: string;
  notes?: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: "Mới", color: "blue" },
  contacted: { label: "Đã liên hệ", color: "yellow" },
  qualified: { label: "Đủ điều kiện", color: "green" },
  converted: { label: "Đã chuyển đổi", color: "purple" },
  lost: { label: "Không phù hợp", color: "red" },
};

const COLUMN_DEFS = [
  { id: "code", label: "Mã" },
  { id: "name", label: "Liên hệ" },
  { id: "companyName", label: "Công ty" },
  { id: "source", label: "Nguồn" },
  { id: "owner", label: "Phụ trách" },
  { id: "status", label: "Trạng thái" },
  { id: "createdAt", label: "Ngày tạo" },
  { id: "actions", label: "Thao tác" },
];

export default function TiemNangPage() {
  const router = useRouter();
  const owners = useOwners();
  const { user, canAssignOthers, canCreate } = useCurrentUser();
  const canAssign = canAssignOthers("leads", "create");
  const allowedCreate = canCreate("leads");
  const { toast } = useToast();

  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortKey, setSortKey] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(COLUMN_DEFS.map((c) => c.id));

  const [createOpen, setCreateOpen] = useState(false);
  const [convertLead, setConvertLead] = useState<Lead | null>(null);
  const [lostLead, setLostLead] = useState<Lead | null>(null);
  const [lostReason, setLostReason] = useState("");

  const [form, setForm] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    source: "Website",
    ownerId: "",
    notes: "",
  });

  const [convertForm, setConvertForm] = useState({
    customerName: "",
    contactName: "",
    createDeal: true,
    dealTitle: "",
    dealValue: "0",
  });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFetch<Lead[]>(
        `/api/v1/leads${toQuery({
          search: query,
          status: status || undefined,
          ownerId: ownerFilter || undefined,
          pageSize: 200,
        })}`
      );
      setRows(result.data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách tiềm năng");
    } finally {
      setLoading(false);
    }
  }, [query, status, ownerFilter]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (user?.id && !form.ownerId) {
      setForm((f) => ({ ...f, ownerId: user.id }));
    }
  }, [user?.id, form.ownerId]);

  async function create() {
    try {
      await apiFetch("/api/v1/leads", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          ownerId: form.ownerId?.trim() ? form.ownerId.trim() : (user?.id ?? undefined),
        }),
      });
      setCreateOpen(false);
      setForm({
        name: "",
        companyName: "",
        email: "",
        phone: "",
        source: "Website",
        ownerId: user?.id ?? "",
        notes: "",
      });
      toast("Đã tạo lead thành công", "success");
      await reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Lỗi tạo lead", "error");
    }
  }

  async function qualify(id: string) {
    try {
      await apiFetch(`/api/v1/leads/${id}/qualify`, { method: "POST" });
      toast("Đã đánh dấu lead đủ điều kiện", "success");
      await reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Lỗi thao tác", "error");
    }
  }

  async function disqualify() {
    if (!lostLead || lostReason.trim().length < 2) {
      toast("Vui lòng nhập lý do không phù hợp", "error");
      return;
    }
    try {
      await apiFetch(`/api/v1/leads/${lostLead.id}/disqualify`, {
        method: "POST",
        body: JSON.stringify({ reason: lostReason }),
      });
      setLostLead(null);
      setLostReason("");
      toast("Đã đánh dấu không phù hợp", "success");
      await reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Lỗi thao tác", "error");
    }
  }

  async function convert() {
    if (!convertLead) return;
    try {
      const result = await apiFetch<{ customerId: string }>(`/api/v1/leads/${convertLead.id}/convert`, {
        method: "POST",
        body: JSON.stringify({
          customerName: convertForm.customerName,
          contactName: convertForm.contactName || undefined,
          createDeal: convertForm.createDeal,
          dealTitle: convertForm.createDeal ? convertForm.dealTitle : undefined,
          dealValue: convertForm.createDeal ? Number(convertForm.dealValue) : undefined,
        }),
      });
      setConvertLead(null);
      toast("Đã chuyển đổi lead thành khách hàng", "success");
      router.push(`/khach-hang/${result.data.customerId}`);
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : "Lỗi chuyển đổi lead", "error");
    }
  }

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let list = rows;
    if (sourceFilter) {
      list = list.filter((r) => r.source === sourceFilter);
    }
    return list;
  }, [rows, sourceFilter]);

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

  const allColumns: DataGridColumn<Lead>[] = [
    {
      id: "code",
      header: "Mã",
      width: "w-28",
      sortable: true,
      cell: (r) => <span className="font-mono text-xs font-semibold text-foreground/90">{r.code}</span>,
    },
    {
      id: "name",
      header: "Liên hệ",
      sortable: true,
      cell: (r) => (
        <div>
          <div className="font-medium text-foreground">{r.name}</div>
          <div className="text-xs text-muted">{r.email || r.phone || "—"}</div>
        </div>
      ),
    },
    {
      id: "companyName",
      header: "Công ty / Tổ chức",
      sortable: true,
      cell: (r) => <span className="text-foreground/90">{r.companyName || "—"}</span>,
    },
    {
      id: "source",
      header: "Nguồn",
      cell: (r) =>
        r.source ? (
          <span className="inline-flex items-center rounded-full bg-surface-raised px-2 py-0.5 text-xs font-medium text-muted">
            {r.source}
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      id: "owner",
      header: "Phụ trách",
      cell: (r) => {
        const ownerName = ownerByIdSync(r.ownerId ?? "", owners).name;
        return (
          <span className="inline-flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
              {ownerName.slice(0, 1)}
            </span>
            <span>{ownerName}</span>
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (r) => {
        const config = STATUS_CONFIG[r.status] ?? { label: r.status, color: "gray" };
        return <StatusDot color={config.color} label={config.label} />;
      },
    },
    {
      id: "createdAt",
      header: "Ngày tạo",
      sortable: true,
      cell: (r) => <span className="text-xs text-muted">{relativeTime(r.createdAt)}</span>,
    },
    {
      id: "actions",
      header: "Thao tác",
      sticky: "right",
      width: "w-36",
      cell: (r) => {
        if (r.status === "converted") {
          return <span className="text-xs italic text-muted">Đã chuyển đổi</span>;
        }
        if (r.status === "lost") {
          return <span className="text-xs italic text-muted">Không phù hợp</span>;
        }
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              title="Đánh dấu đủ điều kiện"
              className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={() => void qualify(r.id)}
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Không phù hợp"
              className="h-7 w-7 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => {
                setLostLead(r);
                setLostReason("");
              }}
            >
              <XCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Chuyển đổi thành khách hàng"
              className="h-7 w-7 text-primary hover:bg-primary/10"
              onClick={() => {
                setConvertLead(r);
                setConvertForm({
                  customerName: r.companyName || r.name,
                  contactName: r.name,
                  createDeal: true,
                  dealTitle: `Cơ hội từ ${r.companyName || r.name}`,
                  dealValue: "0",
                });
              }}
            >
              <UserCheck className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const columns = allColumns.filter((c) => visibleColumns.includes(c.id));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader
        moduleLabel="Tiềm năng"
        onCreate={allowedCreate ? () => setCreateOpen(true) : undefined}
        createLabel="Tạo lead"
      />

      <FilterBar
        filters={
          <>
            <Input
              className="w-56"
              placeholder="Tìm kiếm lead..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
            <Select
              className="w-40"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Trạng thái</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </Select>
            <Select
              className="w-36"
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Nguồn</option>
              {LEAD_SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <OwnerLookup
              className="w-44"
              value={ownerFilter}
              onChange={(v) => {
                setOwnerFilter(v);
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
          </>
        }
      />

      {error ? <p className="px-5 py-2 text-sm text-danger">{error}</p> : null}

      <DataGrid
        columns={columns}
        rows={paginated}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={toggleSort}
        loading={loading}
        empty={
          <EmptyState
            icon={Target}
            title="Chưa có lead"
            description="Tạo lead mới để bắt đầu tiếp cận khách hàng tiềm năng."
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

      {/* Modal Tạo Lead */}
      <Modal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Tạo lead mới"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => void create()}>Lưu lead</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 text-xs font-medium text-foreground">
            Tên liên hệ *
            <Input
              className="mt-1 w-full"
              placeholder="Ví dụ: Nguyễn Văn A"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="text-xs font-medium text-foreground">
            Công ty / Tổ chức
            <Input
              className="mt-1 w-full"
              placeholder="Tên công ty"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
          </label>
          <label className="text-xs font-medium text-foreground">
            Nguồn lead
            <Select
              className="mt-1 w-full"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            >
              {LEAD_SOURCE_OPTIONS.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-xs font-medium text-foreground">
            Email
            <Input
              className="mt-1 w-full"
              type="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="text-xs font-medium text-foreground">
            Điện thoại
            <Input
              className="mt-1 w-full"
              placeholder="0912..."
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label className="col-span-2 text-xs font-medium text-foreground">
            Người phụ trách
            <OwnerLookup
              className="mt-1 w-full"
              allowEmpty={false}
              value={form.ownerId || user?.id || ""}
              onChange={(v) => setForm({ ...form, ownerId: v })}
              disabled={!canAssign}
            />
            {!canAssign ? (
              <span className="mt-0.5 block text-[10px] text-muted">
                Tự động gán cho bạn ({user?.fullName || "Tài khoản của bạn"})
              </span>
            ) : null}
          </label>
          <label className="col-span-2 text-xs font-medium text-foreground">
            Ghi chú nhu cầu
            <Input
              className="mt-1 w-full"
              placeholder="Mô tả nhu cầu ban đầu..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
        </div>
      </Modal>

      {/* Modal Đánh dấu Không phù hợp */}
      <Modal
        open={!!lostLead}
        onOpenChange={(v) => !v && setLostLead(null)}
        title="Đánh dấu không phù hợp"
        footer={
          <>
            <Button variant="outline" onClick={() => setLostLead(null)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={() => void disqualify()}>
              Xác nhận
            </Button>
          </>
        }
      >
        <label className="block text-sm font-medium text-foreground">
          Lý do không phù hợp *
          <Input
            className="mt-1 w-full"
            placeholder="Ví dụ: Sai số, không có nhu cầu, ngoài tầm ngân sách..."
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
          />
        </label>
      </Modal>

      {/* Modal Chuyển đổi Lead */}
      <Modal
        open={!!convertLead}
        onOpenChange={(v) => !v && setConvertLead(null)}
        title="Chuyển đổi lead thành khách hàng"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setConvertLead(null)}>
              Hủy
            </Button>
            <Button onClick={() => void convert()}>Chuyển đổi</Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">
            Tên khách hàng *
            <Input
              className="mt-1 w-full"
              value={convertForm.customerName}
              onChange={(e) => setConvertForm({ ...convertForm, customerName: e.target.value })}
            />
          </label>
          <label className="block text-sm font-medium text-foreground">
            Người liên hệ chính
            <Input
              className="mt-1 w-full"
              value={convertForm.contactName}
              onChange={(e) => setConvertForm({ ...convertForm, contactName: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              className="rounded border-border"
              checked={convertForm.createDeal}
              onChange={(e) => setConvertForm({ ...convertForm, createDeal: e.target.checked })}
            />
            Đồng thời tạo cơ hội bán hàng (Deal)
          </label>
          {convertForm.createDeal ? (
            <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-surface-raised/40 p-3">
              <label className="block text-sm font-medium text-foreground">
                Tên cơ hội
                <Input
                  className="mt-1 w-full"
                  value={convertForm.dealTitle}
                  onChange={(e) => setConvertForm({ ...convertForm, dealTitle: e.target.value })}
                />
              </label>
              <label className="block text-sm font-medium text-foreground">
                Giá trị dự kiến (VNĐ)
                <Input
                  className="mt-1 w-full"
                  value={convertForm.dealValue}
                  onChange={(e) => setConvertForm({ ...convertForm, dealValue: e.target.value })}
                />
              </label>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

