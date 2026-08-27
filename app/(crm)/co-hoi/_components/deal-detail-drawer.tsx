"use client";

import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { DEAL_STAGE_META } from "@/features/deals/types";
import { useProducts } from "@/features/products/hooks/use-products";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import { useActivities } from "@/features/activities/hooks/use-activities";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useToast } from "@/components/ui/toast";
import { daysFromNow, formatDate, relativeTime } from "@/features/shared/utils/date";
import { formatVnd } from "@/features/shared/utils/money";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import Link from "next/link";
import { useState } from "react";

export function DealDetailDrawer() {
  const list = useListPage();
  const { getById } = useDeals();
  const { getById: getCustomer } = useCustomers();
  const { all: products } = useProducts();
  const { rows: followups, create: createTask } = useTasks({ dealId: list.viewId ?? undefined, enabled: !!list.viewId });
  const { rows: activities, create: createActivity } = useActivities({ dealId: list.viewId ?? undefined, enabled: !!list.viewId });
  const { canCreate } = useCurrentUser();
  const { toast } = useToast();
  const [remarketing, setRemarketing] = useState({ type: "call" as const, subject: "", content: "", nextFollowupAt: "" });
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

  const customer = deal.customerId ? getCustomer(deal.customerId) : null;
  const stageMeta = DEAL_STAGE_META[deal.stage] ?? { label: deal.stage || "—", color: "blue", probability: 0 };
  const dealProducts = products.filter((p) => (deal.productIds ?? []).includes(p.id));

  async function createFollowupTask() {
    if (!deal) return;
    try {
      await createTask({
        title: `Follow-up: ${deal.title}`,
        type: "followup",
        status: "open",
        dueAt: daysFromNow(3),
        owner: deal.owner ?? { id: "", name: "—" },
        customerId: deal.customerId,
        dealId: deal.id,
      });
      toast("Đã tạo công việc follow-up", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể tạo công việc", "error");
    }
  }

  async function saveRemarketing() {
    if (!deal || remarketing.subject.trim().length < 2) {
      toast("Nhập nội dung chăm sóc", "error");
      return;
    }
    try {
      await createActivity({
        type: remarketing.type,
        subject: remarketing.subject.trim(),
        content: remarketing.content.trim() || undefined,
        customerId: deal.customerId,
        dealId: deal.id,
        occurredAt: new Date().toISOString(),
      });
      if (remarketing.nextFollowupAt) {
        await createTask({
          title: `Follow-up: ${remarketing.subject.trim()}`,
          type: "followup",
          status: "open",
          dueAt: remarketing.nextFollowupAt,
          owner: deal.owner ?? { id: "", name: "—" },
          customerId: deal.customerId,
          dealId: deal.id,
          notes: remarketing.content.trim() || undefined,
        });
      }
      setRemarketing({ type: "call", subject: "", content: "", nextFollowupAt: "" });
      toast("Đã ghi nhận lịch sử chăm sóc", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Không thể lưu lịch sử chăm sóc", "error");
    }
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
        <Button variant="outline" size="sm" onClick={() => void createFollowupTask()}>
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
          <p>{deal.owner?.name ?? "—"}</p>
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
        <div className="col-span-2 mt-2 border-t border-border pt-3">
          <p className="text-sm font-semibold">Lịch sử chăm sóc / Remarketing</p>
          {canCreate("activities") ? (
            <div className="mt-2 grid grid-cols-2 gap-2 rounded border border-border bg-muted-bg/30 p-2">
              <Select
                value={remarketing.type}
                onChange={(event) => setRemarketing((value) => ({ ...value, type: event.target.value as typeof value.type }))}
              >
                <option value="call">Gọi điện</option>
                <option value="email">Email</option>
                <option value="meeting">Gặp mặt</option>
                <option value="note">Ghi chú</option>
              </Select>
              <Input placeholder="Nội dung chăm sóc *" value={remarketing.subject} onChange={(event) => setRemarketing((value) => ({ ...value, subject: event.target.value }))} />
              <Input className="col-span-2" placeholder="Chi tiết trao đổi" value={remarketing.content} onChange={(event) => setRemarketing((value) => ({ ...value, content: event.target.value }))} />
              <Input type="datetime-local" value={remarketing.nextFollowupAt} onChange={(event) => setRemarketing((value) => ({ ...value, nextFollowupAt: event.target.value }))} />
              <Button size="sm" onClick={() => void saveRemarketing()}>Lưu chăm sóc</Button>
            </div>
          ) : null}
          <div className="mt-2 space-y-2">
            {activities.map((activity) => (
              <div key={activity.id} className="rounded border border-border px-2 py-1.5 text-xs">
                <p className="font-medium">{activity.subject}</p>
                {activity.content ? <p className="text-muted">{activity.content}</p> : null}
                <p className="text-muted">{activity.owner.name} · {relativeTime(activity.occurredAt)}</p>
              </div>
            ))}
            {followups.filter((task) => task.type === "followup" && task.status === "open").map((task) => (
              <div key={task.id} className="rounded border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs text-blue-900">
                Hẹn chăm sóc: {task.title} · {formatDate(task.dueAt)}
              </div>
            ))}
            {!activities.length && !followups.filter((task) => task.type === "followup").length ? <p className="text-xs text-muted">Chưa có lịch sử chăm sóc.</p> : null}
          </div>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-muted">Cập nhật</p>
          <p>{relativeTime(deal.updatedAt)}</p>
        </div>
      </div>
    </Drawer>
  );
}
