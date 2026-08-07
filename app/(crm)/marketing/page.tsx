"use client";

import { ListPageProvider } from "@/features/shared/hooks/use-list-page";
import { CampaignDetailDrawer } from "./_components/campaign-detail-drawer";
import { CampaignFormDialog } from "./_components/campaign-form-dialog";
import { CampaignsTable } from "./_components/campaigns-table";
import { MarketingFilterBar } from "./_components/marketing-filter-bar";
import { MarketingPageHeader } from "./_components/marketing-page-header";

const COLUMNS = [
  "code",
  "name",
  "channel",
  "status",
  "budget",
  "spent",
  "leadsCount",
  "owner",
  "startDate",
  "endDate",
  "actions",
];

export default function MarketingPage() {
  return (
    <ListPageProvider defaultColumns={COLUMNS}>
      <div className="flex h-full min-h-0 flex-col">
        <MarketingPageHeader />
        <MarketingFilterBar />
        <CampaignsTable />
        <CampaignFormDialog />
        <CampaignDetailDrawer />
      </div>
    </ListPageProvider>
  );
}
