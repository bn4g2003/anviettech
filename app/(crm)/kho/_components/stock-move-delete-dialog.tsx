"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useToast } from "@/components/ui/toast";

export function StockMoveDeleteDialog() {
  const list = useListPage();
  const { removeMove, getById } = useInventory();
  const { toast } = useToast();
  const row = list.deleteId ? getById(list.deleteId) : null;

  return (
    <Modal
      open={!!list.deleteId}
      onOpenChange={(v) => !v && list.setDeleteId(null)}
      title="Xóa phiếu kho"
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
                removeMove(list.deleteId);
                toast("Đã xóa phiếu kho", "success");
                list.setDeleteId(null);
              }
            }}
          >
            Xóa
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">Chỉ nên xóa phiếu còn ở trạng thái nháp.</p>
    </Modal>
  );
}
