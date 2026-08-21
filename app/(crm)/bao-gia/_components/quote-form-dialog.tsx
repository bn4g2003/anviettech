"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CustomerLookup } from "@/components/lookups/customer-lookup";
import { DealLookup } from "@/components/lookups/deal-lookup";
import { ProductLookup } from "@/components/lookups/product-lookup";
import { OwnerLookup, ownerById } from "@/components/lookups/owner-lookup";
import { useQuotes } from "@/features/quotes/hooks/use-quotes";
import { useProducts } from "@/features/products/hooks/use-products";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useToast } from "@/components/ui/toast";
import { calcLineTotal, formatVnd, sumAmounts } from "@/features/shared/utils/money";
import { daysFromNow } from "@/features/shared/utils/date";
import type { QuoteStatus } from "@/features/quotes/types";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type LineForm = {
  productId: string;
  qty: number;
  unitPrice: number;
  discountPercent: number;
  vatPercent: number;
};

const emptyLine = (): LineForm => ({
  productId: "",
  qty: 1,
  unitPrice: 0,
  discountPercent: 0,
  vatPercent: 10,
});

const empty = {
  customerId: "",
  dealId: "",
  status: "draft" as QuoteStatus,
  validUntil: daysFromNow(30).slice(0, 10),
  terms: "",
  ownerId: "",
  lines: [emptyLine()] as LineForm[],
};

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

function fromDateInput(date: string) {
  return new Date(`${date}T00:00:00`).toISOString();
}

export function QuoteFormDialog() {
  const list = useListPage();
  const { create, update, getById } = useQuotes();
  const { all: products } = useProducts();
  const { toast } = useToast();
  const open = list.createOpen || !!list.editId;
  const editing = list.editId ? getById(list.editId) : null;
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (editing) {
      setForm({
        customerId: editing.customerId,
        dealId: editing.dealId ?? "",
        status: editing.status,
        validUntil: toDateInput(editing.validUntil),
        terms: editing.terms ?? "",
        ownerId: editing.owner.id,
        lines: editing.lines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          unitPrice: l.unitPrice,
          discountPercent: l.discountPercent,
          vatPercent: l.vatPercent,
        })),
      });
    } else if (list.createOpen) {
      setForm({ ...empty, lines: [emptyLine()] });
    }
  }, [editing, list.createOpen]);

  const previewTotal = useMemo(
    () =>
      sumAmounts(
        form.lines.map((l) =>
          calcLineTotal(l.qty, l.unitPrice, l.discountPercent, l.vatPercent),
        ),
      ),
    [form.lines],
  );

  function close() {
    list.setCreateOpen(false);
    list.setEditId(null);
  }

  function setLine(index: number, patch: Partial<LineForm>) {
    setForm((f) => {
      const lines = f.lines.map((l, i) => (i === index ? { ...l, ...patch } : l));
      return { ...f, lines };
    });
  }

  function onProductChange(index: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    setLine(index, {
      productId,
      unitPrice: product?.unitPrice ?? 0,
      vatPercent: product?.vatPercent ?? 0,
    });
  }

  function save() {
    if (!form.customerId) {
      toast("Vui lòng chọn khách hàng", "error");
      return;
    }
    if (form.lines.length === 0 || form.lines.some((l) => !l.productId)) {
      toast("Vui lòng thêm ít nhất một dòng sản phẩm", "error");
      return;
    }
    const payload = {
      customerId: form.customerId,
      dealId: form.dealId || undefined,
      status: form.status,
      validUntil: fromDateInput(form.validUntil),
      terms: form.terms || undefined,
      owner: ownerById(form.ownerId),
      lines: form.lines.map((l) => ({
        productId: l.productId,
        qty: Number(l.qty) || 1,
        unitPrice: Number(l.unitPrice) || 0,
        discountPercent: Number(l.discountPercent) || 0,
        vatPercent: Number(l.vatPercent) || 0,
      })),
    };
    if (editing) {
      update(editing.id, payload);
      toast("Đã cập nhật báo giá", "success");
    } else {
      create(payload);
      toast("Đã tạo báo giá", "success");
    }
    close();
  }

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && close()}
      title={editing ? "Sửa báo giá" : "Tạo báo giá"}
      size="xl"
      footer={
        <>
          <span className="mr-auto text-sm font-medium">
            Tổng: {formatVnd(previewTotal)}
          </span>
          <Button variant="outline" onClick={close}>
            Hủy
          </Button>
          <Button variant="primary" onClick={save}>
            Lưu
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs">
            <span className="text-muted">Khách hàng *</span>
            <CustomerLookup
              className="w-full"
              allowEmpty={false}
              value={form.customerId}
              onChange={(v) =>
                setForm((f) => ({ ...f, customerId: v, dealId: "" }))
              }
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-muted">Cơ hội</span>
            <DealLookup
              className="w-full"
              customerId={form.customerId || undefined}
              value={form.dealId}
              onChange={(v) => setForm((f) => ({ ...f, dealId: v }))}
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-muted">Hiệu lực đến</span>
            <Input
              type="date"
              value={form.validUntil}
              onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-muted">Trạng thái</span>
            <Select
              className="w-full"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as QuoteStatus }))
              }
            >
              <option value="draft">Nháp</option>
              <option value="sent">Đã gửi</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
              <option value="expired">Hết hạn</option>
            </Select>
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-muted">Phụ trách</span>
            <OwnerLookup
              className="w-full"
              allowEmpty={false}
              value={form.ownerId}
              onChange={(v) => setForm((f) => ({ ...f, ownerId: v }))}
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-muted">Điều khoản</span>
            <Input
              value={form.terms}
              onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))}
              placeholder="Thanh toán 30 ngày..."
            />
          </label>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-muted">Dòng hàng</p>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() =>
                setForm((f) => ({ ...f, lines: [...f.lines, emptyLine()] }))
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm dòng
            </Button>
          </div>
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full min-w-[640px] text-xs">
              <thead className="bg-muted-bg text-left text-muted">
                <tr>
                  <th className="px-2 py-1.5 font-medium">Sản phẩm</th>
                  <th className="w-16 px-2 py-1.5 font-medium">SL</th>
                  <th className="w-28 px-2 py-1.5 font-medium">Đơn giá</th>
                  <th className="w-16 px-2 py-1.5 font-medium">CK%</th>
                  <th className="w-16 px-2 py-1.5 font-medium">VAT%</th>
                  <th className="w-28 px-2 py-1.5 font-medium">Thành tiền</th>
                  <th className="w-10 px-2 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {form.lines.map((line, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-2 py-1">
                      <ProductLookup
                        className="w-full"
                        allowEmpty={false}
                        value={line.productId}
                        onChange={(v) => onProductChange(i, v)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <Input
                        type="number"
                        min={1}
                        value={line.qty}
                        onChange={(e) =>
                          setLine(i, { qty: Number(e.target.value) || 1 })
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <Input
                        type="number"
                        min={0}
                        value={line.unitPrice}
                        onChange={(e) =>
                          setLine(i, { unitPrice: Number(e.target.value) || 0 })
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={line.discountPercent}
                        onChange={(e) =>
                          setLine(i, {
                            discountPercent: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={line.vatPercent}
                        onChange={(e) =>
                          setLine(i, { vatPercent: Number(e.target.value) || 0 })
                        }
                      />
                    </td>
                    <td className="px-2 py-1 tabular-nums">
                      {formatVnd(
                        calcLineTotal(
                          line.qty,
                          line.unitPrice,
                          line.discountPercent,
                          line.vatPercent,
                        ),
                      )}
                    </td>
                    <td className="px-1 py-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        disabled={form.lines.length <= 1}
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            lines: f.lines.filter((_, j) => j !== i),
                          }))
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5 text-danger" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}
