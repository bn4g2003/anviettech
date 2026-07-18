"use client";

import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useQuotes } from "@/features/quotes/hooks/use-quotes";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { useToast } from "@/components/ui/toast";
import { formatVnd } from "@/features/shared/utils/money";
import { formatDate } from "@/features/shared/utils/date";
import { QuoteStatusBadge } from "./quote-status";

export function QuoteDetailDrawer() {
  const list = useListPage();
  const { getById, approve } = useQuotes();
  const { getById: getCustomer } = useCustomers();
  const { all: deals } = useDeals();
  const { toast } = useToast();
  const quote = list.viewId ? getById(list.viewId) : null;

  if (!quote) {
    return (
      <Drawer
        open={!!list.viewId}
        onOpenChange={(v) => !v && list.setViewId(null)}
        title="Chi tiết báo giá"
      >
        <p className="text-sm text-muted">Không tìm thấy</p>
      </Drawer>
    );
  }

  const customer = getCustomer(quote.customerId);
  const deal = quote.dealId ? deals.find((d) => d.id === quote.dealId) : null;
  const canApprove = quote.status === "draft" || quote.status === "sent";

  return (
    <Drawer
      open={!!list.viewId}
      onOpenChange={(v) => !v && list.setViewId(null)}
      title={quote.code}
      description={customer?.name}
      width="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={() => list.setViewId(null)}>
            Đóng
          </Button>
          {canApprove ? (
            <Button
              variant="primary"
              onClick={() => {
                try {
                  const result = approve(quote.id);
                  toast(
                    `Đã duyệt — tạo HĐ ${result.contract.code}${
                      result.order ? ` & ĐH ${result.order.code}` : ""
                    }`,
                    "success",
                  );
                  list.setViewId(null);
                } catch (e) {
                  toast(e instanceof Error ? e.message : "Lỗi duyệt báo giá", "error");
                }
              }}
            >
              Duyệt báo giá
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => {
                list.setViewId(null);
                list.setEditId(quote.id);
              }}
            >
              Sửa
            </Button>
          )}
        </>
      }
    >
      <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-muted">Trạng thái</p>
          <QuoteStatusBadge status={quote.status} />
        </div>
        <div>
          <p className="text-xs text-muted">Tổng tiền</p>
          <p className="font-medium">{formatVnd(quote.total)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Hiệu lực đến</p>
          <p>{formatDate(quote.validUntil)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Phụ trách</p>
          <p>{quote.owner.name}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Cơ hội</p>
          <p>{deal ? `${deal.code} — ${deal.title}` : "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Điều khoản</p>
          <p>{quote.terms || "—"}</p>
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
              <th className="px-2 py-1.5 font-medium">CK%</th>
              <th className="px-2 py-1.5 font-medium">VAT%</th>
              <th className="px-2 py-1.5 font-medium text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {quote.lines.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="px-2 py-1.5">{l.productName}</td>
                <td className="px-2 py-1.5">{l.qty}</td>
                <td className="px-2 py-1.5 tabular-nums">{formatVnd(l.unitPrice)}</td>
                <td className="px-2 py-1.5">{l.discountPercent}%</td>
                <td className="px-2 py-1.5">{l.vatPercent}%</td>
                <td className="px-2 py-1.5 text-right tabular-nums font-medium">
                  {formatVnd(l.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-muted-bg">
              <td colSpan={5} className="px-2 py-1.5 text-right text-muted">
                Tạm tính
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {formatVnd(quote.subtotal)}
              </td>
            </tr>
            <tr className="border-t border-border">
              <td colSpan={5} className="px-2 py-1.5 text-right font-medium">
                Tổng cộng
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums font-semibold">
                {formatVnd(quote.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Drawer>
  );
}
