"use client";

import { SimpleBarChart } from "@/features/analytics/components/simple-bar-chart";
import { useAnalytics } from "@/features/analytics/hooks/use-analytics";
import { formatVnd } from "@/features/shared/utils/money";

export function AnalyticsFunnel() {
  const { dealsByStage } = useAnalytics();

  const items = dealsByStage.map((s) => ({
    id: s.stage,
    label: s.label,
    value: s.value,
    secondary: `${s.count} deal · ${formatVnd(s.value)}`,
  }));

  return (
    <section className="rounded border border-border bg-white p-3">
      <div className="mb-3">
        <h2 className="text-sm font-medium">Phễu cơ hội</h2>
        <p className="text-xs text-muted">Giá trị theo giai đoạn pipeline</p>
      </div>
      <SimpleBarChart
        items={items}
        orientation="horizontal"
        barClassName="bg-foreground/75"
      />
    </section>
  );
}
