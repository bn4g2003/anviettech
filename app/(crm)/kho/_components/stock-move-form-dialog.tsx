"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductLookup } from "@/components/lookups/product-lookup";
import { OwnerLookup, ownerById } from "@/components/lookups/owner-lookup";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import type { StockMoveStatus, StockMoveType } from "@/features/inventory/types";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useToast } from "@/components/ui/toast";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type LineForm = { productId: string; qty: number };

const emptyLine = (): LineForm => ({ productId: "", qty: 1 });

type Props = {
  moveType: StockMoveType;
};

const TITLES: Record<StockMoveType, string> = {
  in: "Tạo phiếu nhập",
  out: "Tạo phiếu xuất",
  transfer: "Tạo điều chuyển",
};

export function StockMoveFormDialog({ moveType }: Props) {
  const list = useListPage();
  const { createMove } = useInventory();
  const { toast } = useToast();
  const open = list.createOpen;
  const [form, setForm] = useState({
    warehouseFrom: "",
    warehouseTo: "Kho chính",
    orderId: "",
    ownerId: "u1",
    note: "",
    lines: [emptyLine()] as LineForm[],
  });

  useEffect(() => {
    if (list.createOpen) {
      setForm({
        warehouseFrom: moveType === "in" ? "" : "Kho chính",
        warehouseTo: moveType === "out" ? "" : "Kho chính",
        orderId: "",
        ownerId: "u1",
        note: "",
        lines: [emptyLine()],
      });
    }
  }, [list.createOpen, moveType]);

  function close() {
    list.setCreateOpen(false);
  }

  function setLine(index: number, patch: Partial<LineForm>) {
    setForm((f) => ({
      ...f,
      lines: f.lines.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    }));
  }

  function save(status: StockMoveStatus) {
    if (form.lines.length === 0 || form.lines.some((l) => !l.productId || l.qty <= 0)) {
      toast("Vui lòng thêm dòng sản phẩm hợp lệ", "error");
      return;
    }
    if (moveType === "in" && !form.warehouseTo.trim()) {
      toast("Vui lòng nhập kho nhận", "error");
      return;
    }
    if (moveType === "out" && !form.warehouseFrom.trim()) {
      toast("Vui lòng nhập kho xuất", "error");
      return;
    }
    if (
      moveType === "transfer" &&
      (!form.warehouseFrom.trim() || !form.warehouseTo.trim())
    ) {
      toast("Vui lòng nhập kho nguồn và kho đích", "error");
      return;
    }

    createMove({
      type: moveType,
      status,
      orderId: form.orderId || undefined,
      warehouseFrom: form.warehouseFrom || undefined,
      warehouseTo: form.warehouseTo || undefined,
      owner: ownerById(form.ownerId),
      note: form.note || undefined,
      lines: form.lines.map((l) => ({
        productId: l.productId,
        qty: Number(l.qty) || 1,
      })),
    });
    toast(
      status === "posted" ? "Đã tạo và ghi sổ phiếu kho" : "Đã tạo phiếu nháp",
      "success",
    );
    close();
  }

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && close()}
      title={TITLES[moveType]}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Hủy
          </Button>
          <Button variant="outline" onClick={() => save("draft")}>
            Lưu nháp
          </Button>
          <Button variant="primary" onClick={() => save("posted")}>
            Ghi sổ
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {moveType !== "in" ? (
            <label className="space-y-1 text-xs">
              <span className="text-muted">Kho xuất *</span>
              <Input
                value={form.warehouseFrom}
                onChange={(e) =>
                  setForm((f) => ({ ...f, warehouseFrom: e.target.value }))
                }
              />
            </label>
          ) : null}
          {moveType !== "out" ? (
            <label className="space-y-1 text-xs">
              <span className="text-muted">Kho nhận *</span>
              <Input
                value={form.warehouseTo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, warehouseTo: e.target.value }))
                }
              />
            </label>
          ) : null}
          <label className="space-y-1 text-xs">
            <span className="text-muted">Đơn hàng (tuỳ chọn)</span>
            <Input
              value={form.orderId}
              onChange={(e) => setForm((f) => ({ ...f, orderId: e.target.value }))}
            />
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
          <label className="col-span-2 space-y-1 text-xs">
            <span className="text-muted">Ghi chú</span>
            <Input
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Dòng hàng</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setForm((f) => ({ ...f, lines: [...f.lines, emptyLine()] }))
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm dòng
            </Button>
          </div>
          {form.lines.map((line, index) => (
            <div key={index} className="flex items-end gap-2">
              <label className="min-w-0 flex-1 space-y-1 text-xs">
                <span className="text-muted">Sản phẩm</span>
                <ProductLookup
                  className="w-full"
                  value={line.productId}
                  onChange={(v) => setLine(index, { productId: v })}
                />
              </label>
              <label className="w-24 space-y-1 text-xs">
                <span className="text-muted">SL</span>
                <Input
                  type="number"
                  min={1}
                  value={line.qty}
                  onChange={(e) =>
                    setLine(index, { qty: Number(e.target.value) || 0 })
                  }
                />
              </label>
              <Button
                variant="ghost"
                size="icon"
                disabled={form.lines.length <= 1}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    lines: f.lines.filter((_, i) => i !== index),
                  }))
                }
              >
                <Trash2 className="h-3.5 w-3.5 text-danger" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
