/** @deprecated Use quotesService.approve / ordersService.confirm / financeService.recordPayment */
export async function approveQuote(quoteId: string) {
  const { quotesService } = await import("@/features/quotes/services/quotes-service");
  return quotesService.approve(quoteId);
}

export async function confirmOrder(orderId: string, warehouseId: string) {
  const { ordersService } = await import("@/features/orders/services/orders-service");
  return ordersService.confirm(orderId, warehouseId);
}

export async function recordPaymentAndSync(input: {
  invoiceId: string;
  customerId: string;
  amount: number;
  method: "bank" | "cash" | "card" | "other";
  paidAt: string;
  owner: { id: string; name: string };
  note?: string;
}) {
  const { financeService } = await import("@/features/finance/services/finance-service");
  return financeService.recordPayment(input);
}
