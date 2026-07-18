"use client";

import { StatusDot } from "@/components/ui/status-dot";
import type { CustomerStatus } from "@/features/customers/types";

const MAP: Record<CustomerStatus, { label: string; color: string }> = {
  active: { label: "Đang hoạt động", color: "green" },
  inactive: { label: "Ngưng", color: "gray" },
  lead: { label: "Lead", color: "blue" },
};

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const meta = MAP[status];
  return <StatusDot color={meta.color} label={meta.label} />;
}
