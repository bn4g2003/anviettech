"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { OwnerLookup } from "@/components/lookups/owner-lookup";
import { useToast } from "@/components/ui/toast";
import { useMarketing } from "@/features/marketing/hooks/use-marketing";
import { useOwners } from "@/features/shared/api/owners";
import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  campaignId: string | null;
  onOpenChange: (open: boolean) => void;
};

export function ConvertLeadDialog({ open, campaignId, onOpenChange }: Props) {
  const { getById } = useMarketing();
  const owners = useOwners();
  const { toast } = useToast();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", email: "", companyName: "", ownerId: "" });
  const campaign = campaignId ? getById(campaignId) : null;

  useEffect(() => {
    if (open) setForm({ name: "", phone: "", email: "", companyName: "", ownerId: owners[0]?.id ?? "" });
  }, [open, campaignId, owners]);

  async function save() {
    if (!campaignId || !form.name.trim()) {
      toast("Nhập tên liên hệ", "error");
      return;
    }
    try {
      const lead = await apiFetch<{ id: string }>("/api/v1/leads", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          companyName: form.companyName || form.name,
          phone: form.phone,
          email: form.email,
          ownerId: form.ownerId || undefined,
          campaignId,
          source: "Campaign",
        }),
      });
      toast("Đã tạo lead từ chiến dịch — mở Tiềm năng để chuyển đổi", "success");
      onOpenChange(false);
      router.push("/tiem-nang");
      void lead;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Lỗi", "error");
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && onOpenChange(false)}
      title="Tạo lead từ chiến dịch"
      description={campaign ? `Chiến dịch: ${campaign.name}` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={() => void save()}>Tạo lead</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input placeholder="Tên liên hệ *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Công ty" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
        <Input placeholder="SĐT" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <OwnerLookup allowEmpty={false} value={form.ownerId} onChange={(v) => setForm({ ...form, ownerId: v })} className="w-full" />
      </div>
    </Modal>
  );
}
