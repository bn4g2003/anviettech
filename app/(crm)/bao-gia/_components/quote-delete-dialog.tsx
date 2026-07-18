"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useQuotes } from "@/features/quotes/hooks/use-quotes";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useToast } from "@/components/ui/toast";

export function QuoteDeleteDialog() {
  const list = useListPage();
  const { remove, getById } = useQuotes();
  const { toast } = useToast();
  const row = list.deleteId ? getById(list.deleteId) : null;

  return (
    <Modal
      open={!!list.deleteId}
      onOpenChange={(v) => !v && list.setDeleteId(null)}
      title="Xóa báo giá"
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
                toast("Đã xóa báo giá", "success");
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
        Hợp đồng / đơn hàng liên quan sẽ vẫn tồn tại nhưng mất liên kết hiển thị.
      </p>
    </Modal>
  );
}
