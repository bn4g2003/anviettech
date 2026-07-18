"use client";

import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { DEAL_STAGE_META } from "@/features/deals/types";
import { useProducts } from "@/features/products/hooks/use-products";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useToast } from "@/components/ui/toast";
import { daysFromNow, formatDate, relativeTime } from "@/features/shared/utils/date";
import { formatVnd } from "@/features/shared/utils/money";
import Link from "next/link";

export function DealDetailDrawer() {
  const list = useListPage();
  const { getById } = useDeals();
  const { getById: getCustomer } = useCustomers();
  const { all: products } = useProducts();
  const { create: createTask } = useTasks();
  const { toast } = useToast();
  const deal = list.viewId ? getById(list.viewId) : null;

  if (!deal) {
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

  const customer = getCustomer(deal.customerId);
  const stageMeta = DEAL_STAGE_META[deal.stage];
  const dealProducts = products.filter((p) => deal.productIds.includes(p.id));

  function createFollowupTask() {
    createTask({
      title: `Follow-up: ${deal!.title}`,
      type: "followup",
      status: "open",
      dueAt: daysFromNow(3),
      owner: deal!.owner,
      customerId: deal!.customerId,
      dealId: deal!.id,
    });
    toast("Đã tạo công việc follow-up", "success");
  }

  return (
    <Drawer
      open={!!list.viewId}
      onOpenChange={(v) => !v && list.setViewId(null)}
      title={deal.title}
      description={`${deal.code} · ${customer?.name ?? ""}`}
      width="max-w-xl"
      footer={
        <>
          <Button variant="outline" onClick={() => list.setViewId(null)}>
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              list.setViewId(null);
              list.setEditId(deal.id);
            }}
          >
            Sửa
          </Button>
        </>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <Link href={`/bao-gia?dealId=${deal.id}`}>
          <Button variant="outline" size="sm">
            Tạo báo giá
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={createFollowupTask}>
          Tạo công việc
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-muted">Giai đoạn</p>
          <StatusDot color={stageMeta.color} label={stageMeta.label} />
        </div>
        <div>
          <p className="text-xs text-muted">Xác suất</p>
          <p className="font-medium">{deal.probability}%</p>
        </div>
        <div>
          <p className="text-xs text-muted">Giá trị</p>
          <p className="font-medium">{formatVnd(deal.value)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Dự kiến chốt</p>
          <p>{formatDate(deal.expectedCloseDate)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Khách hàng</p>
          <p>{customer?.name ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Phụ trách</p>
          <p>{deal.owner.name}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-muted">Sản phẩm</p>
          {dealProducts.length > 0 ? (
            <ul className="mt-0.5 space-y-0.5">
              {dealProducts.map((p) => (
                <li key={p.id}>
                  {p.sku} — {p.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">—</p>
          )}
        </div>
        {deal.notes ? (
          <div className="col-span-2">
            <p className="text-xs text-muted">Ghi chú</p>
            <p>{deal.notes}</p>
          </div>
        ) : null}
        <div className="col-span-2">
          <p className="text-xs text-muted">Cập nhật</p>
          <p>{relativeTime(deal.updatedAt)}</p>
        </div>
      </div>
    </Drawer>
  );
}
