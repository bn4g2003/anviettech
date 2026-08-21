"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CustomerLookup } from "@/components/lookups/customer-lookup";
import { DealLookup } from "@/components/lookups/deal-lookup";
import { OwnerLookup, ownerById } from "@/components/lookups/owner-lookup";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { daysFromNow } from "@/features/shared/utils/date";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import type { TaskStatus, TaskType } from "@/features/tasks/types";
import { TASK_TYPE_LABEL } from "@/features/tasks/types";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useEffect, useState } from "react";

function toDateTimeLocal(iso: string) {
  return iso ? iso.slice(0, 16) : "";
}

function fromDateTimeLocal(local: string) {
  return new Date(local).toISOString();
}

const empty = {
  title: "",
  type: "call" as TaskType,
  status: "open" as TaskStatus,
  dueAt: toDateTimeLocal(daysFromNow(1)),
  ownerId: "",
  customerId: "",
  dealId: "",
  notes: "",
};

export function TaskFormDialog() {
  const list = useListPage();
  const { create, update, getById } = useTasks();
  const { user, canAssignOthers } = useCurrentUser();
  const canAssign = canAssignOthers("tasks", "create");
  const { toast } = useToast();
  const open = list.createOpen || !!list.editId;
  const editing = list.editId ? getById(list.editId) : null;
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        type: editing.type,
        status: editing.status,
        dueAt: toDateTimeLocal(editing.dueAt),
        ownerId: editing.owner.id,
        customerId: editing.customerId ?? "",
        dealId: editing.dealId ?? "",
        notes: editing.notes ?? "",
      });
    } else if (list.createOpen) {
      setForm({ ...empty, ownerId: user?.id ?? "" });
    }
  }, [editing, list.createOpen, user?.id]);

  function close() {
    list.setCreateOpen(false);
    list.setEditId(null);
  }

  function save() {
    if (!form.title.trim()) {
      toast("Vui lòng nhập tiêu đề", "error");
      return;
    }
    const payload = {
      title: form.title.trim(),
      type: form.type,
      status: form.status,
      dueAt: fromDateTimeLocal(form.dueAt),
      owner: ownerById(form.ownerId || user?.id || ""),
      customerId: form.customerId || undefined,
      dealId: form.dealId || undefined,
      notes: form.notes || undefined,
    };
    if (editing) {
      update(editing.id, payload);
      toast("Đã cập nhật công việc", "success");
    } else {
      create(payload);
      toast("Đã tạo công việc", "success");
    }
    close();
  }

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && close()}
      title={editing ? "Sửa công việc" : "Tạo công việc"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Hủy
          </Button>
          <Button variant="primary" onClick={save}>
            {editing ? "Lưu thay đổi" : "Tạo công việc"}
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
          <span className="text-muted">Loại</span>
          <Select
            className="w-full"
            value={form.type}
            onChange={(e) =>
              setForm((f) => ({ ...f, type: e.target.value as TaskType }))
            }
          >
            <option value="call">Cuộc gọi</option>
            <option value="email">Email</option>
            <option value="meeting">Cuộc hẹn</option>
            <option value="todo">Công việc</option>
          </Select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Trạng thái</span>
          <Select
            className="w-full"
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))
            }
          >
            <option value="open">Chưa thực hiện</option>
            <option value="in_progress">Đang thực hiện</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="canceled">Đã hủy</option>
          </Select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Hạn *</span>
          <Input
            type="datetime-local"
            value={form.dueAt}
            onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))}
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
        <label className="space-y-1 text-xs">
          <span className="text-muted">Khách hàng</span>
          <CustomerLookup
            className="w-full"
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
