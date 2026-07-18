"use client";

import { useAnalytics } from "@/features/analytics/hooks/use-analytics";
import { formatVnd } from "@/features/shared/utils/money";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export function AnalyticsCategoryChart() {
  const { categoryRevenue } = useAnalytics();
  const total = categoryRevenue.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <section className="rounded border border-border bg-white p-3">
      <div className="mb-2">
        <h2 className="text-sm font-medium">Cơ cấu doanh thu ngành hàng</h2>
        <p className="text-xs text-muted">Dựa trên đơn hàng thiết bị đã ghi nhận</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={categoryRevenue} dataKey="revenue" nameKey="category" innerRadius={44} outerRadius={68} paddingAngle={3}>
                {categoryRevenue.map((item) => <Cell key={item.category} fill={item.color} />)}
              </Pie>
              <Tooltip formatter={(value) => formatVnd(Number(value))} contentStyle={{ borderRadius: 8, borderColor: "#e5e7eb", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {categoryRevenue.slice(0, 5).map((item) => (
            <div key={item.category} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-1.5"><i className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><span className="truncate">{item.category}</span></span>
              <span className="shrink-0 tabular-nums text-muted">{total ? Math.round((item.revenue / total) * 100) : 0}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
