import { StatusDot } from "@/components/ui/status-dot";
import type { TaskStatus } from "@/features/tasks/types";

const LABELS: Record<TaskStatus, string> = {
  open: "Mở",
  done: "Xong",
  cancelled: "Đã hủy",
};

const COLORS: Record<TaskStatus, string> = {
  open: "blue",
  done: "green",
  cancelled: "red",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <StatusDot color={COLORS[status]} label={LABELS[status]} />;
}
