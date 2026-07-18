"use client";

import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { useMarketing } from "@/features/marketing/hooks/use-marketing";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatDate } from "@/features/shared/utils/date";
import { formatVnd } from "@/features/shared/utils/money";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import {
  CAMPAIGN_CHANNEL_LABELS,
  CampaignStatusBadge,
} from "./campaign-status";
import { ConvertLeadDialog } from "./convert-lead-dialog";

export function CampaignDetailDrawer() {
  const list = useListPage();
  const { getById } = useMarketing();
  const campaign = list.viewId ? getById(list.viewId) : null;
  const [convertOpen, setConvertOpen] = useState(false);

  if (!campaign) {
    return (
      <>
        <Drawer
          open={!!list.viewId}
          onOpenChange={(v) => !v && list.setViewId(null)}
          title="Chi tiết"
        >
          <p className="text-sm text-muted">Không tìm thấy</p>
        </Drawer>
        <ConvertLeadDialog
          open={convertOpen}
          campaignId={null}
          onOpenChange={setConvertOpen}
        />
      </>
    );
  }

  const remaining = campaign.budget - campaign.spent;
  const spendPct =
    campaign.budget > 0
      ? Math.min(100, Math.round((campaign.spent / campaign.budget) * 100))
      : 0;

  return (
    <>
      <Drawer
        open={!!list.viewId}
        onOpenChange={(v) => !v && list.setViewId(null)}
        title={campaign.name}
        description={`${campaign.code} · ${CAMPAIGN_CHANNEL_LABELS[campaign.channel]}`}
        width="max-w-lg"
        footer={
          <>
            <Button variant="outline" onClick={() => list.setViewId(null)}>
              Đóng
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                list.setViewId(null);
                list.setEditId(campaign.id);
              }}
            >
              Sửa
            </Button>
          </>
        }
      >
        <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted">Trạng thái</p>
            <CampaignStatusBadge status={campaign.status} />
          </div>
          <div>
            <p className="text-xs text-muted">Kênh</p>
            <p>{CAMPAIGN_CHANNEL_LABELS[campaign.channel]}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Phụ trách</p>
            <p>{campaign.owner.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Leads</p>
            <p className="font-medium tabular-nums">{campaign.leadsCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Bắt đầu</p>
            <p>{formatDate(campaign.startDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Kết thúc</p>
            <p>{formatDate(campaign.endDate)}</p>
          </div>
        </div>

        <div className="mb-4 space-y-2 rounded border border-border bg-muted-bg/40 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Ngân sách
          </p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted">Ngân sách</p>
              <p className="font-medium">{formatVnd(campaign.budget)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Đã chi</p>
              <p className="font-medium">{formatVnd(campaign.spent)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Còn lại</p>
              <p
                className={
                  remaining < 0 ? "font-medium text-danger" : "font-medium"
                }
              >
                {formatVnd(remaining)}
              </p>
            </div>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-foreground/70"
              style={{ width: `${spendPct}%` }}
            />
          </div>
          <p className="text-[11px] text-muted">Đã dùng {spendPct}% ngân sách</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setConvertOpen(true)}
        >
          <UserPlus className="h-3.5 w-3.5" />
          Chuyển thành KH
        </Button>
      </Drawer>

      <ConvertLeadDialog
        open={convertOpen}
        campaignId={campaign.id}
        onOpenChange={setConvertOpen}
      />
    </>
  );
}
