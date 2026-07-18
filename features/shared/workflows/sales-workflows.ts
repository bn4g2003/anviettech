import { quotesService } from "@/features/quotes/services/quotes-service";
import { contractsService } from "@/features/contracts/services/contracts-service";
import { ordersService } from "@/features/orders/services/orders-service";
import { inventoryService } from "@/features/inventory/services/inventory-service";
import { financeService } from "@/features/finance/services/finance-service";
import { daysFromNow, nowIso } from "@/features/shared/utils/date";
import type { Contract } from "@/features/contracts/types";
import type { Order } from "@/features/orders/types";
import type { Invoice } from "@/features/finance/types";
import type { StockMove } from "@/features/inventory/types";

/** Cross-entity workflows — called from UI via services, never from store directly. */

export function approveQuote(quoteId: string, opts?: { createOrder?: boolean }): {
  contract: Contract;
  order?: Order;
} {
  const quote = quotesService.getById(quoteId);
  if (!quote) throw new Error("Không tìm thấy báo giá");
  quotesService.update(quoteId, { status: "approved" });

  const contract = contractsService.create({
    customerId: quote.customerId,
    quoteId: quote.id,
    dealId: quote.dealId,
    status: "active",
    value: quote.total,
    startDate: nowIso(),
    endDate: daysFromNow(365),
    owner: quote.owner,
    terms: quote.terms,
  });

  let order: Order | undefined;
  if (opts?.createOrder !== false) {
    order = ordersService.create({
      customerId: quote.customerId,
      contractId: contract.id,
      quoteId: quote.id,
      status: "draft",
      owner: quote.owner,
      lines: quote.lines.map((l) => ({
        productId: l.productId,
        qty: l.qty,
        unitPrice: l.unitPrice,
      })),
    });
  }

  return { contract, order };
}

export function confirmOrder(orderId: string): {
  order: Order;
  stockMove: StockMove;
  invoice: Invoice;
} {
  const order = ordersService.getById(orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");

  const updated = ordersService.update(orderId, { status: "confirmed" });

  const stockMove = inventoryService.createMove({
    type: "out",
    status: "draft",
    orderId: order.id,
    warehouseFrom: "Kho chính",
    owner: order.owner,
    lines: order.lines.map((l) => ({
      productId: l.productId,
      qty: l.qty,
    })),
    note: `Xuất theo đơn ${order.code}`,
  });

  const invoice = financeService.createInvoice({
    customerId: order.customerId,
    orderId: order.id,
    contractId: order.contractId,
    amount: order.total,
    dueDate: daysFromNow(15),
    owner: order.owner,
  });

  return { order: updated, stockMove, invoice };
}

export function recordPaymentAndSync(input: {
  invoiceId: string;
  customerId: string;
  amount: number;
  method: "bank" | "cash" | "card" | "other";
  paidAt: string;
  owner: Invoice["owner"];
  note?: string;
}) {
  return financeService.recordPayment(input);
}
