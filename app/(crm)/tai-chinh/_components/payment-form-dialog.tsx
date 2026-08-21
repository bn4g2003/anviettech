"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { OwnerLookup, ownerById } from "@/components/lookups/owner-lookup";
import { useFinance } from "@/features/finance/hooks/use-finance";
import type { PaymentMethod } from "@/features/finance/types";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatVnd } from "@/features/shared/utils/money";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useEffect, useMemo, useState } from "react";

function toDateTimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDateTimeLocal(value: string) {
  return new Date(value).toISOString();
}

export function PaymentFormDialog() {
  const list = useListPage();
  const { allInvoices, recordPayment } = useFinance();
  const { getById: getCustomer } = useCustomers();
  const { user, canAssignOthers } = useCurrentUser();
  const canAssign = canAssignOthers("finance", "create");
  const { toast } = useToast();
  const open = list.createOpen;

  const unpaidInvoices = useMemo(
    () => allInvoices.filter((i) => i.status === "unpaid" || i.status === "partial"),
    [allInvoices],
  );

  const [form, setForm] = useState({
    invoiceId: "",
    amount: 0,
    method: "bank" as PaymentMethod,
    paidAt: toDateTimeLocal(new Date().toISOString()),
    ownerId: "",
    note: "",
  });

  useEffect(() => {
    if (!list.createOpen) return;
    const preset = list.filters.payInvoiceId;
    const inv =
      (preset ? unpaidInvoices.find((i) => i.id === preset) : null) ??
      unpaidInvoices[0];
    setForm({
      invoiceId: inv?.id ?? "",
      amount: inv ? Math.max(0, inv.amount - inv.paidAmount) : 0,
      method: "bank",
      paidAt: toDateTimeLocal(new Date().toISOString()),
      ownerId: inv?.owner.id ?? (user?.id || ""),
      note: "",
    });
  }, [list.createOpen, list.filters.payInvoiceId, unpaidInvoices, user?.id]);

  function close() {
    list.setCreateOpen(false);
    if (list.filters.payInvoiceId) list.setFilter("payInvoiceId", "");
  }

  function onInvoiceChange(invoiceId: string) {
    const inv = unpaidInvoices.find((i) => i.id === invoiceId);
    setForm((f) => ({
      ...f,
      invoiceId,
      amount: inv ? Math.max(0, inv.amount - inv.paidAmount) : 0,
      ownerId: inv?.owner.id ?? f.ownerId,
    }));
  }

  function save() {
    const inv = unpaidInvoices.find((i) => i.id === form.invoiceId);
    if (!inv) {
      toast("Vui lòng chọn hóa đơn", "error");
      return;
    }
    const remaining = inv.amount - inv.paidAmount;
    if (!form.amount || form.amount <= 0) {
      toast("Vui lòng nhập số tiền", "error");
      return;
    }
    if (form.amount > remaining) {
      toast(`Số tiền không vượt quá còn lại (${formatVnd(remaining)})`, "error");
      return;
    }
    recordPayment({
      invoiceId: inv.id,
      customerId: inv.customerId,
      amount: Number(form.amount),
      method: form.method,
      paidAt: fromDateTimeLocal(form.paidAt),
      owner: ownerById(form.ownerId || user?.id || ""),
      note: form.note || undefined,
    });
    toast("Đã ghi thanh toán", "success");
    close();
  }

  const selected = unpaidInvoices.find((i) => i.id === form.invoiceId);

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && close()}
      title="Ghi thanh toán"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Hủy
          </Button>
          <Button variant="primary" onClick={save}>
            Lưu
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 space-y-1 text-xs">
          <span className="text-muted">Hóa đơn *</span>
          <Select
            className="w-full"
            value={form.invoiceId}
            onChange={(e) => onInvoiceChange(e.target.value)}
          >
            <option value="">Chọn hóa đơn chưa TT đủ</option>
            {unpaidInvoices.map((i) => (
              <option key={i.id} value={i.id}>
                {i.code} — {getCustomer(i.customerId)?.name ?? i.customerId} (
                {formatVnd(i.amount - i.paidAmount)} còn lại)
              </option>
            ))}
          </Select>
        </label>
        {selected ? (
          <div className="col-span-2 rounded border border-border bg-muted-bg/40 px-2 py-1.5 text-xs text-muted">
            Tổng {formatVnd(selected.amount)} · Đã TT {formatVnd(selected.paidAmount)} ·
            Còn {formatVnd(selected.amount - selected.paidAmount)}
          </div>
        ) : null}
        <label className="space-y-1 text-xs">
          <span className="text-muted">Số tiền *</span>
          <Input
            type="number"
            min={0}
            value={form.amount}
            onChange={(e) =>
              setForm((f) => ({ ...f, amount: Number(e.target.value) || 0 }))
            }
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Phương thức</span>
          <Select
            className="w-full"
            value={form.method}
            onChange={(e) =>
              setForm((f) => ({ ...f, method: e.target.value as PaymentMethod }))
            }
          >
            <option value="bank">Chuyển khoản</option>
            <option value="cash">Tiền mặt</option>
            <option value="card">Thẻ</option>
            <option value="other">Khác</option>
          </Select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Ngày TT</span>
          <Input
            type="datetime-local"
            value={form.paidAt}
            onChange={(e) => setForm((f) => ({ ...f, paidAt: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Phụ trách</span>
          <OwnerLookup
            className="w-full"
            allowEmpty={false}
            value={form.ownerId || user?.id || ""}
            onChange={(v) => setForm((f) => ({ ...f, ownerId: v }))}
            disabled={!canAssign}
          />
          {!canAssign ? (
            <span className="block text-[10px] text-muted">
              Tự động gán cho bạn ({user?.fullName || "Tài khoản của bạn"})
            </span>
          ) : null}
        </label>
        <label className="col-span-2 space-y-1 text-xs">
          <span className="text-muted">Ghi chú</span>
          <Input
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
        </label>
      </div>
    </Modal>
  );
}
