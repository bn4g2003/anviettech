import { StatusDot } from "@/components/ui/status-dot";
import type { InvoiceStatus } from "@/features/finance/types";

const LABELS: Record<InvoiceStatus, string> = {
  unpaid: "Chưa TT",
  partial: "Một phần",
  paid: "Đã TT",
  cancelled: "Đã hủy",
};

const COLORS: Record<InvoiceStatus, string> = {
  unpaid: "red",
  partial: "orange",
  paid: "green",
  cancelled: "gray",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <StatusDot color={COLORS[status]} label={LABELS[status]} />;
}
