import { StatusDot } from "@/components/ui/status-dot";
import type { StockMoveStatus } from "@/features/inventory/types";

const LABELS: Record<StockMoveStatus, string> = {
  draft: "Nháp",
  posted: "Đã ghi sổ",
  cancelled: "Đã hủy",
};

const COLORS: Record<StockMoveStatus, string> = {
  draft: "gray",
  posted: "green",
  cancelled: "red",
};

export function StockMoveStatusBadge({ status }: { status: StockMoveStatus }) {
  return <StatusDot color={COLORS[status]} label={LABELS[status]} />;
}
