"use client";

import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useFinance } from "@/features/finance/hooks/use-finance";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatDate, formatDateTime, relativeTime } from "@/features/shared/utils/date";
import { formatVnd } from "@/features/shared/utils/money";
import { InvoiceStatusBadge } from "./invoice-status";

export function InvoiceDetailDrawer() {
  const list = useListPage();
  const { getById, payments } = useFinance();
  const { getById: getCustomer } = useCustomers();
  const invoice = list.viewId ? getById(list.viewId) : null;

  if (!invoice) {
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

  const customer = getCustomer(invoice.customerId);
  const relatedPayments = payments.filter((p) => p.invoiceId === invoice.id);
  const canPay = invoice.status === "unpaid" || invoice.status === "partial";

  return (
    <Drawer
      open={!!list.viewId}
      onOpenChange={(v) => !v && list.setViewId(null)}
      title={invoice.code}
      description={`${customer?.name ?? ""} · ${relativeTime(invoice.updatedAt)}`}
      width="max-w-lg"
      footer={
        <>
          <Button variant="outline" onClick={() => list.setViewId(null)}>
            Đóng
          </Button>
          {canPay ? (
            <Button
              variant="primary"
              onClick={() => {
                list.setViewId(null);
                list.setFilter("payInvoiceId", invoice.id);
                list.setCreateOpen(true);
              }}
            >
              Ghi thanh toán
            </Button>
          ) : null}
        </>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted">Trạng thái</p>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
        <div>
          <p className="text-xs text-muted">Khách hàng</p>
          <p>{customer?.name ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Số tiền</p>
          <p className="font-medium">{formatVnd(invoice.amount)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Đã thanh toán</p>
          <p>{formatVnd(invoice.paidAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Còn lại</p>
          <p className="font-medium text-danger">
            {formatVnd(Math.max(0, invoice.amount - invoice.paidAmount))}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Hạn TT</p>
          <p>{formatDate(invoice.dueDate)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Phụ trách</p>
          <p>{invoice.owner.name}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Tạo lúc</p>
          <p>{formatDateTime(invoice.createdAt)}</p>
        </div>
      </div>

      <p className="mb-2 text-xs font-medium">
        Thanh toán liên quan ({relatedPayments.length})
      </p>
      <ul className="space-y-1 text-sm">
        {relatedPayments.map((p) => (
          <li
            key={p.id}
            className="flex justify-between rounded border border-border px-2 py-1.5"
          >
            <span>
              {p.code} · {formatDateTime(p.paidAt)}
            </span>
            <span className="font-medium">{formatVnd(p.amount)}</span>
          </li>
        ))}
        {relatedPayments.length === 0 ? (
          <p className="text-xs text-muted">Chưa có thanh toán</p>
        ) : null}
      </ul>
    </Drawer>
  );
}
