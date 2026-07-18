"use client";

import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatDateTime, relativeTime } from "@/features/shared/utils/date";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import { TASK_TYPE_LABEL } from "@/features/tasks/types";
import { TaskStatusBadge } from "./task-status";

export function TaskDetailDrawer() {
  const list = useListPage();
  const { getById } = useTasks();
  const { getById: getCustomer } = useCustomers();
  const { getById: getDeal } = useDeals();
  const task = list.viewId ? getById(list.viewId) : null;

  if (!task) {
    return (
      <Drawer
        open={!!list.viewId}
        onOpenChange={(v) => !v && list.setViewId(null)}
        title="Chi tiết"
      >
        <p className="text-sm text-muted">Không tìm thấy</p>
      </Drawer>
    );
  }

  const customer = task.customerId ? getCustomer(task.customerId) : null;
  const deal = task.dealId ? getDeal(task.dealId) : null;

  return (
    <Drawer
      open={!!list.viewId}
      onOpenChange={(v) => !v && list.setViewId(null)}
      title={task.title}
      description={`${TASK_TYPE_LABEL[task.type]} · ${relativeTime(task.updatedAt)}`}
      width="max-w-lg"
      footer={
        <>
          <Button variant="outline" onClick={() => list.setViewId(null)}>
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              list.setViewId(null);
              list.setEditId(task.id);
            }}
          >
            Sửa
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted">Trạng thái</p>
          <TaskStatusBadge status={task.status} />
        </div>
        <div>
          <p className="text-xs text-muted">Loại</p>
          <p>{TASK_TYPE_LABEL[task.type]}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Hạn</p>
          <p>{formatDateTime(task.dueAt)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Phụ trách</p>
          <p>{task.owner.name}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Khách hàng</p>
          <p>{customer?.name ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Cơ hội</p>
          <p>{deal?.title ?? "—"}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-muted">Ghi chú</p>
          <p>{task.notes || "—"}</p>
        </div>
      </div>
    </Drawer>
  );
}
