import { StatusDot } from "@/components/ui/status-dot";
import type { CampaignChannel, CampaignStatus } from "@/features/marketing/types";

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Nháp",
  running: "Đang chạy",
  paused: "Tạm dừng",
  completed: "Hoàn thành",
};

const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: "gray",
  running: "green",
  paused: "orange",
  completed: "blue",
};

export const CAMPAIGN_CHANNEL_LABELS: Record<CampaignChannel, string> = {
  email: "Email",
  social: "Mạng xã hội",
  ads: "Quảng cáo",
  event: "Sự kiện",
  other: "Khác",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <StatusDot color={STATUS_COLORS[status]} label={CAMPAIGN_STATUS_LABELS[status]} />
  );
}
