"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useToast } from "@/components/ui/toast";

export function DealDeleteDialog() {
  const list = useListPage();
  const { remove, getById } = useDeals();
  const { toast } = useToast();
  const row = list.deleteId ? getById(list.deleteId) : null;

  return (
    <Modal
      open={!!list.deleteId}
      onOpenChange={(v) => !v && list.setDeleteId(null)}
      title="Xóa cơ hội"
      description={row ? `Xóa "${row.title}"? Thao tác không thể hoàn tác.` : undefined}
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
                toast("Đã xóa cơ hội", "success");
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
        Báo giá / công việc liên quan vẫn tồn tại nhưng mất liên kết hiển thị.
      </p>
    </Modal>
  );
}
