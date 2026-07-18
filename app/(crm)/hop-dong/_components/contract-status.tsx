import { StatusDot } from "@/components/ui/status-dot";
import type { ContractStatus } from "@/features/contracts/types";

const LABELS: Record<ContractStatus, string> = {
  draft: "Nháp",
  active: "Hiệu lực",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

const COLORS: Record<ContractStatus, string> = {
  draft: "gray",
  active: "green",
  completed: "purple",
  cancelled: "red",
};

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return <StatusDot color={COLORS[status]} label={LABELS[status]} />;
}
