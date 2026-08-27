"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CustomerLookup } from "@/components/lookups/customer-lookup";
import { OwnerLookup, ownerById } from "@/components/lookups/owner-lookup";
import { useContracts } from "@/features/contracts/hooks/use-contracts";
import { useQuotes } from "@/features/quotes/hooks/use-quotes";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { daysFromNow } from "@/features/shared/utils/date";
import type { ContractStatus } from "@/features/contracts/types";
import { useEffect, useMemo, useState } from "react";

function toDateInput(iso?: string | null) {
  return iso ? iso.slice(0, 10) : "";
}

function fromDateInput(date?: string | null) {
  return date || "";
}

const empty = {
  customerId: "",
  quoteId: "",
  status: "draft" as ContractStatus,
  value: 0,
  startDate: toDateInput(new Date().toISOString()),
  endDate: toDateInput(daysFromNow(365)),
  terms: "",
  ownerId: "",
};

export function ContractFormDialog() {
  const list = useListPage();
  const { create, update, getById } = useContracts();
  const { all: quotes } = useQuotes();
  const { user, canAssignOthers } = useCurrentUser();
  const canAssign = canAssignOthers("contracts", "create");
  const { toast } = useToast();
  const open = list.createOpen || !!list.editId;
  const editing = list.editId ? getById(list.editId) : null;
  const [form, setForm] = useState(empty);

  const approvedQuotes = useMemo(() => {
    if (!form.customerId) return [];
    return quotes.filter(
      (q) => q.customerId === form.customerId && q.status === "approved",
    );
  }, [quotes, form.customerId]);

  useEffect(() => {
    if (editing) {
      setForm({
        customerId: editing.customerId,
        quoteId: editing.quoteId ?? "",
        status: editing.status,
        value: editing.value,
        startDate: toDateInput(editing.startDate),
        endDate: toDateInput(editing.endDate),
        terms: editing.terms ?? "",
        ownerId: editing.owner.id,
      });
    } else if (list.createOpen) {
      setForm({ ...empty, ownerId: user?.id ?? "" });
    }
  }, [editing, list.createOpen, user?.id]);

  function close() {
    list.setCreateOpen(false);
    list.setEditId(null);
  }

  function onQuoteChange(quoteId: string) {
    const quote = quotes.find((q) => q.id === quoteId);
    setForm((f) => ({
      ...f,
      quoteId,
      customerId: quote?.customerId ?? f.customerId,
      value: quote?.total ?? f.value,
      terms: quote?.terms ?? f.terms,
      ownerId: quote?.owner.id ?? f.ownerId,
    }));
  }

  async function save() {
    if (!form.customerId) {
      toast("Vui lòng chọn khách hàng", "error");
      return;
    }
    if (!form.value || form.value <= 0) {
      toast("Vui lòng nhập giá trị hợp đồng", "error");
      return;
    }
    const payload = {
      customerId: form.customerId,
      quoteId: form.quoteId || undefined,
      status: form.status,
      value: Number(form.value) || 0,
      startDate: fromDateInput(form.startDate),
      endDate: fromDateInput(form.endDate),
      terms: form.terms || undefined,
      owner: ownerById(form.ownerId || user?.id || ""),
    };
    try {
      if (editing) {
        await update(editing.id, payload);
        toast("Đã cập nhật hợp đồng", "success");
      } else {
        await create(payload);
        toast("Đã tạo hợp đồng", "success");
      }
      close();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể lưu hợp đồng", "error");
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && close()}
      title={editing ? "Sửa hợp đồng" : "Tạo hợp đồng"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Hủy
          </Button>
          <Button variant="primary" onClick={() => void save()}>
            Lưu
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-xs">
          <span className="text-muted">Khách hàng *</span>
          <CustomerLookup
            className="w-full"
            allowEmpty={false}
            value={form.customerId}
            disabled={Boolean(editing?.quoteId)}
            onChange={(v) =>
              setForm((f) => ({ ...f, customerId: v, quoteId: "" }))
            }
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Báo giá đã duyệt</span>
          <Select
            className="w-full"
            value={form.quoteId}
            disabled={Boolean(editing?.quoteId)}
            onChange={(e) => onQuoteChange(e.target.value)}
          >
            <option value="">Không liên kết</option>
            {approvedQuotes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.code} — {q.total.toLocaleString("vi-VN")}₫
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Giá trị *</span>
          <Input
            type="number"
            min={0}
            value={form.value}
            onChange={(e) =>
              setForm((f) => ({ ...f, value: Number(e.target.value) || 0 }))
            }
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Trạng thái</span>
          <Select
            className="w-full"
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                status: e.target.value as ContractStatus,
              }))
            }
          >
            <option value="draft">Nháp</option>
            <option value="active">Hiệu lực</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </Select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Ngày bắt đầu</span>
          <Input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Ngày kết thúc</span>
          <Input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Phụ trách</span>
          <OwnerLookup
            className="w-full"
            allowEmpty={false}
            value={form.ownerId || user?.id || ""}
            onChange={(v) => setForm((f) => ({ ...f, ownerId: v }))}
            disabled={!editing && !canAssign}
          />
          {!editing && !canAssign ? (
            <span className="block text-[10px] text-muted">
              Tự động gán cho bạn ({user?.fullName || "Tài khoản của bạn"})
            </span>
          ) : null}
        </label>
        <label className="col-span-2 space-y-1 text-xs">
          <span className="text-muted">Điều khoản</span>
          <Input
            value={form.terms}
            onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))}
            placeholder="Điều khoản thanh toán, bảo hành..."
          />
        </label>
      </div>
    </Modal>
  );
}
