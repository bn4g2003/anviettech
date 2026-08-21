"use client";

import { OwnerLookup, ownerById } from "@/components/lookups/owner-lookup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useMarketing } from "@/features/marketing/hooks/use-marketing";
import type { CampaignChannel, CampaignStatus } from "@/features/marketing/types";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { daysFromNow, nowIso } from "@/features/shared/utils/date";
import { useEffect, useState } from "react";
import {
  CAMPAIGN_CHANNEL_LABELS,
  CAMPAIGN_STATUS_LABELS,
} from "./campaign-status";

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

function fromDateInput(date: string) {
  return new Date(`${date}T00:00:00`).toISOString();
}

const empty = {
  name: "",
  channel: "email" as CampaignChannel,
  status: "draft" as CampaignStatus,
  budget: 0,
  spent: 0,
  leadsCount: 0,
  ownerId: "",
  startDate: toDateInput(nowIso()),
  endDate: toDateInput(daysFromNow(30)),
};

export function CampaignFormDialog() {
  const list = useListPage();
  const { create, update, getById } = useMarketing();
  const { user, canAssignOthers } = useCurrentUser();
  const canAssign = canAssignOthers("campaigns", "create");
  const { toast } = useToast();
  const open = list.createOpen || !!list.editId;
  const editing = list.editId ? getById(list.editId) : null;
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        channel: editing.channel,
        status: editing.status,
        budget: editing.budget,
        spent: editing.spent,
        leadsCount: editing.leadsCount,
        ownerId: editing.owner.id,
        startDate: toDateInput(editing.startDate),
        endDate: toDateInput(editing.endDate),
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
    if (!form.name.trim()) {
      toast("Vui lòng nhập tên chiến dịch", "error");
      return;
    }
    const payload = {
      name: form.name.trim(),
      channel: form.channel,
      status: form.status,
      budget: Number(form.budget) || 0,
      spent: Number(form.spent) || 0,
      leadsCount: Number(form.leadsCount) || 0,
      owner: ownerById(form.ownerId || user?.id || ""),
      startDate: fromDateInput(form.startDate),
      endDate: fromDateInput(form.endDate),
    };
    if (editing) {
      update(editing.id, payload);
      toast("Đã cập nhật chiến dịch", "success");
    } else {
      create(payload);
      toast("Đã tạo chiến dịch", "success");
    }
    close();
  }

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && close()}
      title={editing ? "Sửa chiến dịch" : "Tạo chiến dịch"}
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
          <span className="text-muted">Tên chiến dịch *</span>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Kênh</span>
          <Select
            className="w-full"
            value={form.channel}
            onChange={(e) =>
              setForm((f) => ({ ...f, channel: e.target.value as CampaignChannel }))
            }
          >
            {Object.entries(CAMPAIGN_CHANNEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Trạng thái</span>
          <Select
            className="w-full"
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.target.value as CampaignStatus }))
            }
          >
            {Object.entries(CAMPAIGN_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Ngân sách (VND)</span>
          <Input
            type="number"
            min={0}
            value={form.budget}
            onChange={(e) =>
              setForm((f) => ({ ...f, budget: Number(e.target.value) || 0 }))
            }
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Đã chi (VND)</span>
          <Input
            type="number"
            min={0}
            value={form.spent}
            onChange={(e) =>
              setForm((f) => ({ ...f, spent: Number(e.target.value) || 0 }))
            }
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted">Số leads</span>
          <Input
            type="number"
            min={0}
            value={form.leadsCount}
            onChange={(e) =>
              setForm((f) => ({ ...f, leadsCount: Number(e.target.value) || 0 }))
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
      </div>
    </Modal>
  );
}
