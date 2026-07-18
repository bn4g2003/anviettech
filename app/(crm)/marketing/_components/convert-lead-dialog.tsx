"use client";

import { OwnerLookup, ownerById } from "@/components/lookups/owner-lookup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useMarketing } from "@/features/marketing/hooks/use-marketing";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  campaignId: string | null;
  onOpenChange: (open: boolean) => void;
};

const empty = {
  name: "",
  phone: "",
  email: "",
  ownerId: "u1",
};

export function ConvertLeadDialog({ open, campaignId, onOpenChange }: Props) {
  const { convertLead, getById } = useMarketing();
  const { toast } = useToast();
  const [form, setForm] = useState(empty);
  const campaign = campaignId ? getById(campaignId) : null;

  useEffect(() => {
    if (open) setForm(empty);
  }, [open, campaignId]);

  function close() {
    onOpenChange(false);
    setForm(empty);
  }

  function save() {
    if (!campaignId) return;
    if (!form.name.trim()) {
      toast("Vui lòng nhập tên khách hàng", "error");
      return;
    }
    convertLead(campaignId, {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      owner: ownerById(form.ownerId),
    });
    toast("Đã chuyển lead thành khách hàng", "success");
    close();
  }

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && close()}
      title="Chuyển thành khách hàng"
      description={
        campaign
          ? `Tạo KH từ chiến dịch ${campaign.code} — ${campaign.name}`
          : undefined
      }
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Hủy
          </Button>
          <Button variant="primary" onClick={save}>
            Chuyển thành KH
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
        <label className="col-span-2 space-y-1 text-xs">
          <span className="text-muted">Phụ trách</span>
          <OwnerLookup
            className="w-full"
            allowEmpty={false}
            value={form.ownerId}
            onChange={(v) => setForm((f) => ({ ...f, ownerId: v }))}
          />
        </label>
      </div>
    </Modal>
  );
}
