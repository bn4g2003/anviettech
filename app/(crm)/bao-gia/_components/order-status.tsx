import { StatusDot } from "@/components/ui/status-dot";
import type { OrderStatus } from "@/features/orders/types";

const LABELS: Record<OrderStatus, string> = {
  draft: "Nháp",
  confirmed: "Đã xác nhận",
  fulfilled: "Đã giao",
  cancelled: "Đã hủy",
};

const COLORS: Record<OrderStatus, string> = {
  draft: "gray",
  confirmed: "blue",
  fulfilled: "green",
  cancelled: "red",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <StatusDot color={COLORS[status]} label={LABELS[status]} />;
}
