"use client";

import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useTasks } from "@/features/tasks/hooks/use-tasks";
import { useQuotes } from "@/features/quotes/hooks/use-quotes";
import { useContracts } from "@/features/contracts/hooks/use-contracts";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatVnd } from "@/features/shared/utils/money";
import { CustomerStatusBadge } from "@/features/customers/components/customer-status-badge";
import Link from "next/link";

export function CustomerDetailDrawer() {
  const list = useListPage();
  const { getById, getDebt } = useCustomers();
  const customer = list.viewId ? getById(list.viewId) : null;
  const { byCustomer } = useDeals();
  const tasks = useTasks();
  const quotes = useQuotes({ customerId: customer?.id });
  const contracts = useContracts({ customerId: customer?.id });

  if (!customer) {
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

  const deals = byCustomer(customer.id);
  const customerTasks = tasks.all.filter((t) => t.customerId === customer.id);
  const debt = getDebt(customer.id);

  return (
    <Drawer
      open={!!list.viewId}
      onOpenChange={(v) => !v && list.setViewId(null)}
      title={customer.name}
      description={`${customer.code} · ${customer.contactName ?? ""}`}
      width="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={() => list.setViewId(null)}>
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              list.setViewId(null);
              list.setEditId(customer.id);
            }}
          >
            Sửa
          </Button>
        </>
      }
    >
      <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-muted">Trạng thái</p>
          <CustomerStatusBadge status={customer.status} />
        </div>
        <div>
          <p className="text-xs text-muted">Công nợ</p>
          <p className="font-medium text-danger">{formatVnd(debt)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">SĐT</p>
          <p>{customer.phone}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Email</p>
          <p>{customer.email}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-muted">Địa chỉ</p>
          <p>{customer.address}</p>
        </div>
      </div>

      <Tabs defaultValue="deals">
        <TabsList>
          <TabsTrigger value="deals">Cơ hội ({deals.length})</TabsTrigger>
          <TabsTrigger value="tasks">Công việc ({customerTasks.length})</TabsTrigger>
          <TabsTrigger value="quotes">Báo giá ({quotes.rows.length})</TabsTrigger>
          <TabsTrigger value="contracts">HĐ ({contracts.rows.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="deals">
          <ul className="space-y-1 text-sm">
            {deals.map((d) => (
              <li
                key={d.id}
                className="flex justify-between rounded border border-border px-2 py-1.5"
              >
                <span>
                  {d.code} — {d.title}
                </span>
                <span className="text-muted">{formatVnd(d.value)}</span>
              </li>
            ))}
            {deals.length === 0 ? (
              <p className="text-xs text-muted">Chưa có cơ hội</p>
            ) : null}
          </ul>
          <Link
            href={`/co-hoi?customerId=${customer.id}`}
            className="mt-2 inline-block text-xs underline"
          >
            Xem tất cả cơ hội →
          </Link>
        </TabsContent>
        <TabsContent value="tasks">
          <ul className="space-y-1 text-sm">
            {customerTasks.slice(0, 8).map((t) => (
              <li key={t.id} className="rounded border border-border px-2 py-1.5">
                {t.title}
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="quotes">
          <ul className="space-y-1 text-sm">
            {quotes.rows.map((q) => (
              <li
                key={q.id}
                className="flex justify-between rounded border border-border px-2 py-1.5"
              >
                <span>{q.code}</span>
                <span>{formatVnd(q.total)}</span>
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="contracts">
          <ul className="space-y-1 text-sm">
            {contracts.rows.map((c) => (
              <li
                key={c.id}
                className="flex justify-between rounded border border-border px-2 py-1.5"
              >
                <span>{c.code}</span>
                <span>{formatVnd(c.value)}</span>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </Drawer>
  );
}
