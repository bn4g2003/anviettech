"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useMarketing } from "@/features/marketing/hooks/use-marketing";
import { useListPage } from "@/features/shared/hooks/use-list-page";

export function CampaignDeleteDialog() {
  const list = useListPage();
  const { remove, getById } = useMarketing();
  const { toast } = useToast();
  const row = list.deleteId ? getById(list.deleteId) : null;

  return (
    <Modal
      open={!!list.deleteId}
      onOpenChange={(v) => !v && list.setDeleteId(null)}
      title="Xóa chiến dịch"
      description={
        row ? `Xóa "${row.name}"? Thao tác không thể hoàn tác.` : undefined
      }
      footer={
        <>
          <Button variant="outline" onClick={() => list.setDeleteId(null)}>
            Hủy
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (list.deleteId) {
                remove(list.deleteId);
                toast("Đã xóa chiến dịch", "success");
                list.setDeleteId(null);
              }
            }}
          >
            Xóa
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">
        Khách hàng đã chuyển từ chiến dịch này vẫn được giữ lại.
      </p>
    </Modal>
  );
}
