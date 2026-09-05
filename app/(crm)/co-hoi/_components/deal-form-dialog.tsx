"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CustomerLookup } from "@/components/lookups/customer-lookup";
import { OwnerLookup, ownerById } from "@/components/lookups/owner-lookup";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { DEAL_STAGE_META, type DealStage } from "@/features/deals/types";
import { useProducts } from "@/features/products/hooks/use-products";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { daysFromNow } from "@/features/shared/utils/date";
import { useEffect, useState } from "react";

const STAGES = Object.keys(DEAL_STAGE_META) as DealStage[];

function toDateInput(iso?: string | null) {
  return iso ? iso.slice(0, 10) : "";
}

function fromDateInput(value?: string | null) {
  return value || daysFromNow(14).slice(0, 10);
}

const empty = {
  title: "",
  customerId: "",
  stage: "new" as DealStage,
  value: "",
  expectedCloseDate: toDateInput(daysFromNow(14)),
  ownerId: "",
  productIds: [] as string[],
  notes: "",
  reason: "",
};

export function DealFormDialog() {
  const list = useListPage();
  const { create, update, getById } = useDeals();
  const { all: products } = useProducts();
  const { user, canAssignOthers } = useCurrentUser();
  const canAssign = canAssignOthers("deals", "create");
  const { toast } = useToast();
  const open = list.createOpen || !!list.editId;
  const editing = list.editId ? getById(list.editId) : null;
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        customerId: editing.customerId,
        stage: editing.stage,
        value: String(editing.value),
        expectedCloseDate: toDateInput(editing.expectedCloseDate),
        ownerId: editing.owner.id,
        productIds: [...editing.productIds],
        notes: editing.notes ?? "",
        reason: editing.closedReason ?? "",
      });
    } else if (list.createOpen) {
      setForm({
        ...empty,
        ownerId: user?.id ?? "",
        customerId: list.filters.customerId || "",
        expectedCloseDate: toDateInput(daysFromNow(14)),
      });
    }
  }, [editing, list.createOpen, list.filters.customerId, user?.id]);

  function close() {
    list.setCreateOpen(false);
    list.setEditId(null);
  }

  function toggleProduct(id: string) {
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id)
        ? f.productIds.filter((x) => x !== id)
        : [...f.productIds, id],
    }));
  }

  async function save() {
    if (!form.title.trim()) {
      toast("Vui lòng nhập tiêu đề", "error");
      return;
    }
    if (!form.customerId) {
      toast("Vui lòng chọn khách hàng", "error");
      return;
    }
    if ((form.stage === "won" || form.stage === "lost") && !form.reason.trim()) {
      toast("Vui lòng nhập lý do khi thắng hoặc thua", "error");
      return;
    }
    const value = Number(form.value) || 0;
    const payload = {
      title: form.title.trim(),
      customerId: form.customerId,
      stage: form.stage,
      value,
      owner: ownerById(form.ownerId || user?.id || ""),
      expectedCloseDate: fromDateInput(form.expectedCloseDate),
      productIds: form.productIds,
      notes: form.notes,
      reason: form.reason.trim() || undefined,
    };
    try {
      if (editing) {
        await update(editing.id, payload);
        toast("Đã cập nhật cơ hội", "success");
      } else {
        await create(payload);
        toast("Đã tạo cơ hội", "success");
      }
      close();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể lưu cơ hội", "error");
    }
  }

  const activeProducts = products.filter((p) => p.status === "active");

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && close()}
      title={editing ? "Sửa cơ hội" : "Tạo cơ hội"}
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
        <label className="col-span-2 space-y-1 text-xs">
          <span className="text-muted">Tiêu đề *</span>
          <Input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Khách hàng *</span>
          <CustomerLookup
            className="w-full"
            allowEmpty={!form.customerId}
            value={form.customerId}
            onChange={(v) => setForm((f) => ({ ...f, customerId: v }))}
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Giai đoạn</span>
          <Select
            className="w-full"
            value={form.stage}
            onChange={(e) =>
              setForm((f) => ({ ...f, stage: e.target.value as DealStage }))
            }
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {DEAL_STAGE_META[s].label}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Giá trị (VND)</span>
          <Input
            type="number"
            min={0}
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Dự kiến chốt</span>
          <Input
            type="date"
            value={form.expectedCloseDate}
            onChange={(e) =>
              setForm((f) => ({ ...f, expectedCloseDate: e.target.value }))
            }
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
        <div className="col-span-2 space-y-1 text-xs">
          <span className="text-muted">Sản phẩm</span>
          <div className="max-h-28 space-y-1 overflow-y-auto rounded border border-border p-2">
            {activeProducts.map((p) => (
              <label key={p.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.productIds.includes(p.id)}
                  onChange={() => toggleProduct(p.id)}
                />
                <span>
                  {p.sku} — {p.name}
                </span>
              </label>
            ))}
            {activeProducts.length === 0 ? (
              <p className="text-muted">Chưa có sản phẩm</p>
            ) : null}
          </div>
        </div>
        <label className="col-span-2 space-y-1 text-xs">
          <span className="text-muted">Ghi chú</span>
          <Input
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </label>
        {form.stage === "won" || form.stage === "lost" ? (
          <label className="col-span-2 space-y-1 text-xs">
            <span className="text-muted">Lý do *</span>
            <Input
              value={form.reason}
              maxLength={1000}
              placeholder={form.stage === "won" ? "Lý do cơ hội thắng" : "Lý do cơ hội thua"}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            />
          </label>
        ) : null}
      </div>
    </Modal>
  );
}
