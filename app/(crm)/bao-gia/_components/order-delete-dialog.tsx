"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/features/orders/hooks/use-orders";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useToast } from "@/components/ui/toast";

export function OrderDeleteDialog() {
  const list = useListPage();
  const { remove, getById } = useOrders();
  const { toast } = useToast();
  const row = list.deleteId ? getById(list.deleteId) : null;

  return (
    <Modal
      open={!!list.deleteId}
      onOpenChange={(v) => !v && list.setDeleteId(null)}
      title="Xóa đơn hàng"
      description={row ? `Xóa "${row.code}"? Thao tác không thể hoàn tác.` : undefined}
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
                toast("Đã xóa đơn hàng", "success");
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
        Phiếu kho / hóa đơn liên quan sẽ vẫn tồn tại nhưng mất liên kết hiển thị.
      </p>
    </Modal>
  );
}
