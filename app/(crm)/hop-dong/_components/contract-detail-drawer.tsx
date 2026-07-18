"use client";

import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useContracts } from "@/features/contracts/hooks/use-contracts";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useQuotes } from "@/features/quotes/hooks/use-quotes";
import { useOrders } from "@/features/orders/hooks/use-orders";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatVnd } from "@/features/shared/utils/money";
import { formatDate } from "@/features/shared/utils/date";
import { ContractStatusBadge } from "./contract-status";

export function ContractDetailDrawer() {
  const list = useListPage();
  const { getById } = useContracts();
  const { getById: getCustomer } = useCustomers();
  const { all: quotes } = useQuotes();
  const { all: orders } = useOrders();
  const { all: deals } = useDeals();
  const contract = list.viewId ? getById(list.viewId) : null;

  if (!contract) {
    return (
      <Drawer
        open={!!list.viewId}
        onOpenChange={(v) => !v && list.setViewId(null)}
        title="Chi tiết hợp đồng"
      >
        <p className="text-sm text-muted">Không tìm thấy</p>
      </Drawer>
    );
  }

  const customer = getCustomer(contract.customerId);
  const quote = contract.quoteId
    ? quotes.find((q) => q.id === contract.quoteId)
    : null;
  const deal = contract.dealId
    ? deals.find((d) => d.id === contract.dealId)
    : null;
  const linkedOrders = orders.filter((o) => o.contractId === contract.id);

  return (
    <Drawer
      open={!!list.viewId}
      onOpenChange={(v) => !v && list.setViewId(null)}
      title={contract.code}
      description={customer?.name}
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
              list.setEditId(contract.id);
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
          <ContractStatusBadge status={contract.status} />
        </div>
        <div>
          <p className="text-xs text-muted">Giá trị</p>
          <p className="font-medium">{formatVnd(contract.value)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Bắt đầu</p>
          <p>{formatDate(contract.startDate)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Kết thúc</p>
          <p>{formatDate(contract.endDate)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Phụ trách</p>
          <p>{contract.owner.name}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Điều khoản</p>
          <p>{contract.terms || "—"}</p>
        </div>
      </div>

      <p className="mb-1.5 text-xs font-medium text-muted">Liên kết</p>
      <ul className="space-y-1 text-sm">
        <li className="flex justify-between rounded border border-border px-2 py-1.5">
          <span className="text-muted">Báo giá</span>
          <span>{quote?.code ?? "—"}</span>
        </li>
        <li className="flex justify-between rounded border border-border px-2 py-1.5">
          <span className="text-muted">Cơ hội</span>
          <span>{deal ? `${deal.code} — ${deal.title}` : "—"}</span>
        </li>
        <li className="rounded border border-border px-2 py-1.5">
          <p className="mb-1 text-xs text-muted">
            Đơn hàng ({linkedOrders.length})
          </p>
          {linkedOrders.length === 0 ? (
            <p className="text-xs text-muted">Chưa có đơn hàng</p>
          ) : (
            <ul className="space-y-0.5">
              {linkedOrders.map((o) => (
                <li key={o.id} className="flex justify-between text-xs">
                  <span>{o.code}</span>
                  <span>{formatVnd(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </li>
      </ul>
    </Drawer>
  );
}
