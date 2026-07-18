import { StatusDot } from "@/components/ui/status-dot";
import type { QuoteStatus } from "@/features/quotes/types";

const LABELS: Record<QuoteStatus, string> = {
  draft: "Nháp",
  sent: "Đã gửi",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  expired: "Hết hạn",
};

const COLORS: Record<QuoteStatus, string> = {
  draft: "gray",
  sent: "blue",
  approved: "green",
  rejected: "red",
  expired: "orange",
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return <StatusDot color={COLORS[status]} label={LABELS[status]} />;
}

export function quoteStatusLabel(status: QuoteStatus) {
  return LABELS[status];
}
