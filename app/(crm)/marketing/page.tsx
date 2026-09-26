"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ListPageProvider, useListPage } from "@/features/shared/hooks/use-list-page";
import { CampaignDetailDrawer } from "./_components/campaign-detail-drawer";
import { CampaignFormDialog } from "./_components/campaign-form-dialog";
import { CampaignsTable } from "./_components/campaigns-table";
import { MarketingFilterBar } from "./_components/marketing-filter-bar";
import { MarketingPageHeader } from "./_components/marketing-page-header";
import { MarketingAnalyticsView } from "./_components/marketing-analytics-view";

const COLUMNS = [
  "code",
  "name",
  "channel",
  "landingPageUrl",
  "status",
  "budget",
  "spent",
  "leadsCount",
  "owner",
  "startDate",
  "endDate",
  "actions",
];

function MarketingContent() {
  const { filters, setFilter } = useListPage();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const viewMode = filters.viewMode === "analytics" ? "analytics" : "campaigns";

  useEffect(() => {
    if (tab === "analytics") {
      setFilter("viewMode", "analytics");
    } else if (tab === "campaigns") {
      setFilter("viewMode", "campaigns");
    }
  }, [tab, setFilter]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MarketingPageHeader />
      {viewMode === "analytics" ? (
        <MarketingAnalyticsView />
      ) : (
        <>
          <MarketingFilterBar />
          <CampaignsTable />
          <CampaignFormDialog />
          <CampaignDetailDrawer />
        </>
      )}
    </div>
  );
}

export default function MarketingPage() {
  return (
    <ListPageProvider defaultColumns={COLUMNS}>
      <Suspense fallback={<div className="p-4 text-xs text-muted">Đang tải...</div>}>
        <MarketingContent />
      </Suspense>
    </ListPageProvider>
  );
}

