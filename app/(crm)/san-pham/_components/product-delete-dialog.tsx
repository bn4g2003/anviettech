"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/features/products/hooks/use-products";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useToast } from "@/components/ui/toast";

export function ProductDeleteDialog() {
  const list = useListPage();
  const { remove, getById } = useProducts();
  const { toast } = useToast();
  const row = list.deleteId ? getById(list.deleteId) : null;

  return (
    <Modal
      open={!!list.deleteId}
      onOpenChange={(v) => !v && list.setDeleteId(null)}
      title="Xóa sản phẩm"
      description={row ? `Xóa "${row.name}"? Thao tác không thể hoàn tác.` : undefined}
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
                toast("Đã xóa sản phẩm", "success");
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
        Dữ liệu liên quan sẽ vẫn tồn tại nhưng mất liên kết hiển thị.
      </p>
    </Modal>
  );
}
