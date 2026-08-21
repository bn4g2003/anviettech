"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useRouter } from "next/navigation";

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

const STATUS_LABEL: Record<string, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  qualified: "Đủ điều kiện",
  lost: "Không phù hợp",
  converted: "Đã chuyển đổi",
};

export default function TiemNangPage() {
  const router = useRouter();
  const owners = useOwners();
  const { user, canAssignOthers } = useCurrentUser();
  const canAssign = canAssignOthers("leads", "create");
  const { toast } = useToast();
  const [rows, setRows] = useState<Lead[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
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
    try {
      const result = await apiFetch<Lead[]>(`/api/v1/leads${toQuery({ search: query, status, pageSize: 100 })}`);
      setRows(result.data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải lead");
    }
  }, [query, status]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (user?.id && !form.ownerId) setForm((f) => ({ ...f, ownerId: user.id }));
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
      setForm({ name: "", companyName: "", email: "", phone: "", source: "Website", ownerId: user?.id ?? "", notes: "" });
      toast("Đã tạo lead", "success");
      await reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Lỗi tạo lead", "error");
    }
  }

  async function qualify(id: string) {
    try {
      await apiFetch(`/api/v1/leads/${id}/qualify`, { method: "POST" });
      toast("Đã đánh dấu đủ điều kiện", "success");
      await reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Lỗi", "error");
    }
  }

  async function disqualify() {
    if (!lostLead || lostReason.trim().length < 2) {
      toast("Nhập lý do", "error");
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
      toast(err instanceof Error ? err.message : "Lỗi", "error");
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
      toast("Đã chuyển đổi lead", "success");
      router.push(`/khach-hang/${result.data.customerId}`);
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : "Lỗi chuyển đổi", "error");
    }
  }

  const filtered = useMemo(() => rows, [rows]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppHeader moduleLabel="Tiềm năng" onCreate={() => setCreateOpen(true)} createLabel="Tạo lead" />
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Input className="max-w-xs" placeholder="Tìm lead..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select className="w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>
      {error ? <p className="px-5 py-3 text-sm text-danger">{error}</p> : null}
      <div className="flex-1 overflow-auto p-5">
        <div className="overflow-auto rounded-lg border border-border bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="p-3">Mã</th>
                <th>Liên hệ</th>
                <th>Công ty</th>
                <th>Nguồn</th>
                <th>Phụ trách</th>
                <th>Trạng thái</th>
                <th className="p-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-mono text-xs">{lead.code}</td>
                  <td>
                    <div className="font-medium">{lead.name}</div>
                    <div className="text-xs text-muted">{lead.email || lead.phone || "—"}</div>
                  </td>
                  <td>{lead.companyName || "—"}</td>
                  <td>{lead.source || "—"}</td>
                  <td>{ownerByIdSync(lead.ownerId ?? "", owners).name}</td>
                  <td>{STATUS_LABEL[lead.status] ?? lead.status}</td>
                  <td className="space-x-1 p-3">
                    {lead.status !== "converted" && lead.status !== "lost" ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => void qualify(lead.id)}>
                          Đủ ĐK
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLostLead(lead);
                            setLostReason("");
                          }}
                        >
                          Không phù hợp
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setConvertLead(lead);
                            setConvertForm({
                              customerName: lead.companyName || lead.name,
                              contactName: lead.name,
                              createDeal: true,
                              dealTitle: `Cơ hội từ ${lead.companyName || lead.name}`,
                              dealValue: "0",
                            });
                          }}
                        >
                          Chuyển đổi
                        </Button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length ? <EmptyState title="Chưa có lead" description="Tạo lead để bắt đầu pipeline." /> : null}
        </div>
      </div>

      <Modal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Tạo lead"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => void create()}>Lưu</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 text-xs">
            Tên liên hệ *
            <Input className="mt-1 w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="text-xs">
            Công ty
            <Input className="mt-1 w-full" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          </label>
          <label className="text-xs">
            Nguồn
            <Input className="mt-1 w-full" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          </label>
          <label className="text-xs">
            Email
            <Input className="mt-1 w-full" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="text-xs">
            Điện thoại
            <Input className="mt-1 w-full" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label className="col-span-2 text-xs">
            Phụ trách
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
          <label className="col-span-2 text-xs">
            Ghi chú
            <Input className="mt-1 w-full" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>
        </div>
      </Modal>

      <Modal
        open={!!lostLead}
        onOpenChange={(v) => !v && setLostLead(null)}
        title="Không phù hợp"
        footer={
          <>
            <Button variant="outline" onClick={() => setLostLead(null)}>
              Hủy
            </Button>
            <Button onClick={() => void disqualify()}>Xác nhận</Button>
          </>
        }
      >
        <label className="block text-sm">
          Lý do *
          <Input className="mt-1 w-full" value={lostReason} onChange={(e) => setLostReason(e.target.value)} />
        </label>
      </Modal>

      <Modal
        open={!!convertLead}
        onOpenChange={(v) => !v && setConvertLead(null)}
        title="Chuyển đổi lead"
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
          <label className="block text-sm">
            Tên khách hàng *
            <Input
              className="mt-1 w-full"
              value={convertForm.customerName}
              onChange={(e) => setConvertForm({ ...convertForm, customerName: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            Liên hệ chính
            <Input
              className="mt-1 w-full"
              value={convertForm.contactName}
              onChange={(e) => setConvertForm({ ...convertForm, contactName: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={convertForm.createDeal}
              onChange={(e) => setConvertForm({ ...convertForm, createDeal: e.target.checked })}
            />
            Tạo cơ hội
          </label>
          {convertForm.createDeal ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                Tên cơ hội
                <Input
                  className="mt-1 w-full"
                  value={convertForm.dealTitle}
                  onChange={(e) => setConvertForm({ ...convertForm, dealTitle: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Giá trị dự kiến
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
