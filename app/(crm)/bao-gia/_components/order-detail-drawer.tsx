"use client";

import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/features/orders/hooks/use-orders";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useQuotes } from "@/features/quotes/hooks/use-quotes";
import { useContracts } from "@/features/contracts/hooks/use-contracts";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useToast } from "@/components/ui/toast";
import { formatVnd } from "@/features/shared/utils/money";
import { OrderStatusBadge } from "./order-status";

export function OrderDetailDrawer() {
  const list = useListPage();
  const { getById, confirm } = useOrders();
  const { getById: getCustomer } = useCustomers();
  const { all: quotes } = useQuotes();
  const { all: contracts } = useContracts();
  const { toast } = useToast();
  const order = list.viewId ? getById(list.viewId) : null;

  if (!order) {
    return (
      <Drawer
        open={!!list.viewId}
        onOpenChange={(v) => !v && list.setViewId(null)}
        title="Chi tiết đơn hàng"
      >
        <p className="text-sm text-muted">Không tìm thấy</p>
      </Drawer>
    );
  }

  const customer = getCustomer(order.customerId);
  const quote = order.quoteId ? quotes.find((q) => q.id === order.quoteId) : null;
  const contract = order.contractId
    ? contracts.find((c) => c.id === order.contractId)
    : null;
  const canConfirm = order.status === "draft";

  return (
    <Drawer
      open={!!list.viewId}
      onOpenChange={(v) => !v && list.setViewId(null)}
      title={order.code}
      description={customer?.name}
      width="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={() => list.setViewId(null)}>
            Đóng
          </Button>
          {canConfirm ? (
            <Button
              variant="primary"
              onClick={() => {
                try {
                  const result = confirm(order.id);
                  toast(
                    `Đã xác nhận — phiếu xuất & HĐ ${result.invoice.code}`,
                    "success",
                  );
                  list.setViewId(null);
                } catch (e) {
                  toast(e instanceof Error ? e.message : "Lỗi xác nhận đơn", "error");
                }
              }}
            >
              Xác nhận đơn hàng
            </Button>
          ) : null}
        </>
      }
    >
      <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-muted">Trạng thái</p>
          <OrderStatusBadge status={order.status} />
        </div>
        <div>
          <p className="text-xs text-muted">Tổng tiền</p>
          <p className="font-medium">{formatVnd(order.total)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Báo giá</p>
          <p>{quote?.code ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Hợp đồng</p>
          <p>{contract?.code ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Phụ trách</p>
          <p>{order.owner.name}</p>
        </div>
      </div>

      <p className="mb-1.5 text-xs font-medium text-muted">Dòng hàng</p>
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted-bg text-left text-muted">
            <tr>
              <th className="px-2 py-1.5 font-medium">Sản phẩm</th>
              <th className="px-2 py-1.5 font-medium">SL</th>
              <th className="px-2 py-1.5 font-medium">Đơn giá</th>
              <th className="px-2 py-1.5 font-medium text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="px-2 py-1.5">{l.productName}</td>
                <td className="px-2 py-1.5">{l.qty}</td>
                <td className="px-2 py-1.5 tabular-nums">{formatVnd(l.unitPrice)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums font-medium">
                  {formatVnd(l.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border">
              <td colSpan={3} className="px-2 py-1.5 text-right font-medium">
                Tổng cộng
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums font-semibold">
                {formatVnd(order.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Drawer>
  );
}
