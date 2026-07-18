"use client";

import { KpiCard } from "@/features/analytics/components/kpi-card";
import { useAnalytics } from "@/features/analytics/hooks/use-analytics";
import { formatVnd } from "@/features/shared/utils/money";

export function AnalyticsKpiRow() {
  const data = useAnalytics();

  const cards = [
    {
      label: "Doanh thu tháng này",
      value: formatVnd(data.revenueThisMonth),
      href: "/bao-gia",
      hint: "Theo hóa đơn đã thu",
    },
    {
      label: "Pipeline",
      value: formatVnd(data.pipelineValue),
      href: "/co-hoi",
      hint: "Cơ hội đang mở",
    },
    {
      label: "Tỷ lệ thắng",
      value: `${data.winRate}%`,
      href: "/co-hoi",
      hint: "Won / closed",
      tone: data.winRate >= 50 ? ("success" as const) : ("default" as const),
    },
    {
      label: "Công nợ",
      value: formatVnd(data.totalDebt),
      href: "/tai-chinh",
      hint: "Tổng phải thu",
      tone: data.totalDebt > 0 ? ("danger" as const) : ("default" as const),
    },
    {
      label: "Tồn thấp",
      value: String(data.lowStockCount),
      href: "/kho",
      hint: "SKU dưới định mức",
    },
    {
      label: "Việc mở",
      value: String(data.openTasks),
      href: "/cong-viec",
      hint: "Công việc chưa xong",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 px-3 py-2 md:grid-cols-3 xl:grid-cols-6">
      {cards.map((c) => (
        <KpiCard
          key={c.label}
          label={c.label}
          value={c.value}
          href={c.href}
          hint={c.hint}
          tone={c.tone}
        />
      ))}
    </div>
  );
}
