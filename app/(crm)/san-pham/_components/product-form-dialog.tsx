"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useProducts } from "@/features/products/hooks/use-products";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useToast } from "@/components/ui/toast";
import { useEffect, useState } from "react";
import type { ProductStatus } from "@/features/products/types";

const empty = {
  sku: "",
  name: "",
  category: "Thiết bị điện",
  unit: "cái",
  unitPrice: 0,
  vatPercent: 8,
  minStock: 0,
  status: "active" as ProductStatus,
  description: "",
};

export function ProductFormDialog() {
  const list = useListPage();
  const { create, update, getById, categories } = useProducts();
  const { toast } = useToast();
  const open = list.createOpen || !!list.editId;
  const editing = list.editId ? getById(list.editId) : null;
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (editing) {
      setForm({
        sku: editing.sku,
        name: editing.name,
        category: editing.category,
        unit: editing.unit,
        unitPrice: editing.unitPrice,
        vatPercent: editing.vatPercent,
        minStock: editing.minStock,
        status: editing.status,
        description: editing.description ?? "",
      });
    } else if (list.createOpen) {
      setForm(empty);
    }
  }, [editing, list.createOpen]);

  function close() {
    list.setCreateOpen(false);
    list.setEditId(null);
  }

  function save() {
    if (!form.sku.trim()) {
      toast("Vui lòng nhập SKU", "error");
      return;
    }
    if (!form.name.trim()) {
      toast("Vui lòng nhập tên sản phẩm", "error");
      return;
    }
    const payload = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      category: form.category,
      unit: form.unit,
      unitPrice: Number(form.unitPrice) || 0,
      vatPercent: Number(form.vatPercent) || 0,
      minStock: Number(form.minStock) || 0,
      status: form.status,
      description: form.description.trim() || undefined,
    };
    if (editing) {
      update(editing.id, payload);
      toast("Đã cập nhật sản phẩm", "success");
    } else {
      create(payload);
      toast("Đã tạo sản phẩm", "success");
    }
    close();
  }

  const categoryOptions = categories.includes(form.category)
    ? categories
    : form.category
      ? [form.category, ...categories]
      : categories;

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && close()}
      title={editing ? "Sửa sản phẩm" : "Tạo sản phẩm"}
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
        <label className="space-y-1 text-xs">
          <span className="text-muted">SKU *</span>
          <Input
            value={form.sku}
            onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Trạng thái</span>
          <Select
            className="w-full"
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.target.value as ProductStatus }))
            }
          >
            <option value="active">Đang bán</option>
            <option value="inactive">Ngưng</option>
          </Select>
        </label>
        <label className="col-span-2 space-y-1 text-xs">
          <span className="text-muted">Tên sản phẩm *</span>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Danh mục</span>
          <Select
            className="w-full"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Đơn vị</span>
          <Input
            value={form.unit}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Đơn giá</span>
          <Input
            type="number"
            min={0}
            value={form.unitPrice}
            onChange={(e) =>
              setForm((f) => ({ ...f, unitPrice: Number(e.target.value) }))
            }
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">VAT (%)</span>
          <Input
            type="number"
            min={0}
            value={form.vatPercent}
            onChange={(e) =>
              setForm((f) => ({ ...f, vatPercent: Number(e.target.value) }))
            }
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Tồn tối thiểu</span>
          <Input
            type="number"
            min={0}
            value={form.minStock}
            onChange={(e) =>
              setForm((f) => ({ ...f, minStock: Number(e.target.value) }))
            }
          />
        </label>
        <label className="col-span-2 space-y-1 text-xs">
          <span className="text-muted">Mô tả</span>
          <Input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </label>
      </div>
    </Modal>
  );
}
