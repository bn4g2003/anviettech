"use client";

import { useAnalytics } from "@/features/analytics/hooks/use-analytics";
import { formatVnd } from "@/features/shared/utils/money";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function AnalyticsRevenueChart() {
  const { revenueForecast } = useAnalytics();

  return (
    <section className="rounded border border-border bg-white p-3">
      <div className="mb-3">
        <h2 className="text-sm font-medium">Xu hướng doanh thu & dự báo</h2>
        <p className="text-xs text-muted">Dự báo 2 tháng theo biến động trung bình của 6 tháng gần nhất</p>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenueForecast} margin={{ top: 8, right: 6, left: 2, bottom: 0 }}>
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
            <YAxis hide />
            <Tooltip
              formatter={(value) => formatVnd(Number(value))}
              contentStyle={{ borderRadius: 8, borderColor: "#e5e7eb", fontSize: 12 }}
            />
            <Line type="monotone" dataKey="actual" name="Đã thu" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="forecast" name="Dự báo" stroke="#f97316" strokeWidth={2.5} strokeDasharray="5 4" dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex items-center gap-4 text-[11px] text-muted">
        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-blue-600" />Đã thu</span>
        <span className="flex items-center gap-1"><i className="h-0.5 w-3 bg-orange-500" />Dự báo</span>
      </div>
    </section>
  );
}
