"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { OwnerLookup } from "@/components/lookups/owner-lookup";
import { useOwners } from "@/features/shared/api/owners";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useToast } from "@/components/ui/toast";
import { useEffect, useState } from "react";
import type { CustomerType, CustomerStatus } from "@/features/customers/types";

const empty = {
  name: "",
  type: "company" as CustomerType,
  phone: "",
  email: "",
  address: "",
  ownerId: "",
  source: "Cold call",
  status: "active" as CustomerStatus,
  contactName: "",
  notes: "",
};

export function CustomerFormDialog() {
  const list = useListPage();
  const { create, update, getById } = useCustomers();
  const owners = useOwners();
  const { toast } = useToast();
  const open = list.createOpen || !!list.editId;
  const editing = list.editId ? getById(list.editId) : null;
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        type: editing.type,
        phone: editing.phone,
        email: editing.email,
        address: editing.address,
        ownerId: editing.owner.id,
        source: editing.source,
        status: editing.status,
        contactName: editing.contactName ?? "",
        notes: editing.notes ?? "",
      });
    } else if (list.createOpen) {
      setForm({ ...empty, ownerId: owners[0]?.id ?? "" });
    }
  }, [editing, list.createOpen, owners]);

  function close() {
    list.setCreateOpen(false);
    list.setEditId(null);
  }

  async function save() {
    if (!form.name.trim()) {
      toast("Vui lòng nhập tên", "error");
      return;
    }
    const owner: OwnerRef = form.ownerId?.trim()
      ? (owners.find((o) => o.id === form.ownerId) ?? { id: form.ownerId, name: "—" })
      : (owners[0] ?? { id: "", name: "—" });
    const payload = {
      name: form.name,
      type: form.type,
      phone: form.phone,
      email: form.email,
      address: form.address,
      owner,
      source: form.source,
      status: form.status === "lead" ? ("active" as CustomerStatus) : form.status,
      contactName: form.contactName,
      notes: form.notes,
      logoColor: editing?.logoColor ?? "#374151",
    };
    setSaving(true);
    try {
      if (editing) {
        await update(editing.id, payload);
        toast("Đã cập nhật khách hàng", "success");
      } else {
        await create(payload);
        toast("Đã tạo khách hàng", "success");
      }
      close();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Không thể lưu", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && close()}
      title={editing ? "Sửa khách hàng" : "Tạo khách hàng"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Hủy
          </Button>
          <Button variant="primary" onClick={() => void save()} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 space-y-1 text-xs">
          <span className="text-muted">Tên / Tổ chức *</span>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Loại</span>
          <Select
            className="w-full"
            value={form.type}
            onChange={(e) =>
              setForm((f) => ({ ...f, type: e.target.value as CustomerType }))
            }
          >
            <option value="company">Doanh nghiệp</option>
            <option value="individual">Cá nhân</option>
          </Select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Trạng thái</span>
          <Select
            className="w-full"
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.target.value as CustomerStatus }))
            }
          >
            <option value="active">Đang hoạt động</option>
            <option value="lead">Lead</option>
            <option value="inactive">Ngưng</option>
          </Select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Người liên hệ</span>
          <Input
            value={form.contactName}
            onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">SĐT</span>
          <Input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Email</span>
          <Input
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
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
        <label className="space-y-1 text-xs">
          <span className="text-muted">Nguồn</span>
          <Select
            className="w-full"
            value={form.source}
            onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
          >
            <option value="Marketing">Marketing</option>
            <option value="Giới thiệu">Giới thiệu</option>
            <option value="Cold call">Cold call</option>
          </Select>
        </label>
        <label className="col-span-2 space-y-1 text-xs">
          <span className="text-muted">Địa chỉ</span>
          <Input
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </label>
        <label className="col-span-2 space-y-1 text-xs">
          <span className="text-muted">Ghi chú</span>
          <Input
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </label>
      </div>
    </Modal>
  );
}
