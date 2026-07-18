"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import { useToast } from "@/components/ui/toast";

export function TaskDeleteDialog() {
  const list = useListPage();
  const { remove, getById } = useTasks();
  const { toast } = useToast();
  const row = list.deleteId ? getById(list.deleteId) : null;

  return (
    <Modal
      open={!!list.deleteId}
      onOpenChange={(v) => !v && list.setDeleteId(null)}
      title="Xóa công việc"
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
                toast("Đã xóa công việc", "success");
                list.setDeleteId(null);
              }
            }}
          >
            Xóa
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">Công việc sẽ bị xóa khỏi danh sách.</p>
    </Modal>
  );
}
