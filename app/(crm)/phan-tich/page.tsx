"use client";

import { AnalyticsFunnel } from "./_components/analytics-funnel";
import { AnalyticsHeader } from "./_components/analytics-header";
import { AnalyticsKpiRow } from "./_components/analytics-kpi-row";
import { AnalyticsRevenueChart } from "./_components/analytics-revenue-chart";
import { AnalyticsTopCustomers } from "./_components/analytics-top-customers";
import { AnalyticsCategoryChart } from "./_components/analytics-category-chart";
import { AnalyticsReplenishmentForecast } from "./_components/analytics-replenishment-forecast";

export default function AnalyticsPage() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <AnalyticsHeader />
      <div className="min-h-0 flex-1 overflow-auto">
        <AnalyticsKpiRow />
        <div className="grid grid-cols-1 gap-2 px-3 pb-3 lg:grid-cols-2">
          <AnalyticsFunnel />
          <AnalyticsRevenueChart />
          <AnalyticsCategoryChart />
          <AnalyticsReplenishmentForecast />
          <div className="lg:col-span-2">
            <AnalyticsTopCustomers />
          </div>
        </div>
      </div>
    </div>
  );
}
