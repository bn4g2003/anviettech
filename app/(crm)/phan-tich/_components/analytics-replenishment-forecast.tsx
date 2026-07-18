"use client";

import { Badge } from "@/components/ui/badge";
import { useAnalytics } from "@/features/analytics/hooks/use-analytics";
import { AlertTriangle, TrendingUp } from "lucide-react";

export function AnalyticsReplenishmentForecast() {
  const { replenishmentForecast } = useAnalytics();

  return (
    <section className="rounded border border-border bg-white p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Dự báo cần nhập hàng</h2>
          <p className="text-xs text-muted">Ước tính bán 30 ngày từ tốc độ xuất 90 ngày gần nhất</p>
        </div>
        <TrendingUp className="h-4 w-4 text-blue-600" />
      </div>
      <div className="space-y-2">
        {replenishmentForecast.map((item) => {
          const urgent = item.coverageDays < 30;
          return (
            <div key={item.productId} className="rounded-md border border-border/70 px-2.5 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{item.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted">Tồn {item.stock} · Nhu cầu dự báo {item.forecastQty}</p>
                </div>
                <Badge tone={urgent ? "danger" : "neutral"}>
                  {urgent ? <AlertTriangle className="mr-1 h-3 w-3" /> : null}
                  {item.coverageDays} ngày
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
