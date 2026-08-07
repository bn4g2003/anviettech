"use client";

import { useAnalytics } from "@/features/analytics/hooks/use-analytics";
import { AnalyticsHeader } from "./_components/analytics-header";
import { AnalyticsKpiRow } from "./_components/analytics-kpi-row";
import { FinancialMatrixTable } from "./_components/financial-matrix-table";
import { FinancialChartsOverview } from "./_components/financial-charts-overview";
import { AnalyticsFunnel } from "./_components/analytics-funnel";
import { AnalyticsTopCustomers } from "./_components/analytics-top-customers";
import { AnalyticsReplenishmentForecast } from "./_components/analytics-replenishment-forecast";
import { Loader2 } from "lucide-react";

export default function AnalyticsPage() {
  const {
    year,
    setYear,
    loading,
    matrixRows,
    monthlyOverview,
    revenueBreakdown,
    expenseBreakdown,
    availableYears,
  } = useAnalytics();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <AnalyticsHeader />
      <div className="min-h-0 flex-1 overflow-auto p-3 space-y-3">
        {/* Top KPI row */}
        <AnalyticsKpiRow />

        {/* Loading Indicator or Primary Content */}
        {loading && matrixRows.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-md border border-border bg-white">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang tải dữ liệu phân tích HĐKD...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Primary Financial Matrix Table (phan-tich.md) */}
            <FinancialMatrixTable
              year={year}
              rows={matrixRows}
              onYearChange={setYear}
              availableYears={availableYears}
            />

            {/* Visual Overview Charts */}
            <FinancialChartsOverview
              monthlyOverview={monthlyOverview}
              revenueBreakdown={revenueBreakdown}
              expenseBreakdown={expenseBreakdown}
            />

            {/* Operational Widgets */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <AnalyticsFunnel />
              <AnalyticsReplenishmentForecast />
              <div className="lg:col-span-2">
                <AnalyticsTopCustomers />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
