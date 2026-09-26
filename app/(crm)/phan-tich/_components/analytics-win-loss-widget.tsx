"use client";

import { useDeals } from "@/features/deals/hooks/use-deals";
import { calculateWinLossMetrics } from "@/features/deals/win-loss";
import { formatVnd } from "@/features/shared/utils/money";
import { Trophy, TrendingUp, PieChart as PieIcon, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export function AnalyticsWinLossWidget() {
  const { rows, loading } = useDeals();
  const metrics = calculateWinLossMetrics(rows);

  return (
    <section className="rounded-md border border-border bg-white p-4 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-muted" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Tỷ Lệ Thắng / Thua & Hiệu Quả Bán Hàng
              </h3>
              <p className="text-xs text-muted">
                Đánh giá tỷ lệ chốt deal và phân bổ cơ hội bán hàng
              </p>
            </div>
          </div>
          <Link
            href="/co-hoi"
            className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
          >
            Chi tiết cơ hội <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Stats highlight row */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded border border-border bg-white p-2 text-center">
            <span className="text-[10px] text-muted font-medium uppercase tracking-wide">
              Tỷ lệ Thắng
            </span>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {metrics.winRate}%
            </p>
            <span className="text-[10px] text-muted">
              {metrics.wonCount} won / {metrics.wonCount + metrics.lostCount} closed
            </span>
          </div>

          <div className="rounded border border-border bg-white p-2 text-center">
            <span className="text-[10px] text-muted font-medium uppercase tracking-wide">
              Doanh Thu Thắng
            </span>
            <p className="text-sm font-bold text-foreground mt-1 truncate">
              {formatVnd(metrics.wonValue)}
            </p>
            <span className="text-[10px] text-muted">
              {metrics.wonCount} dự án thành công
            </span>
          </div>

          <div className="rounded border border-border bg-white p-2 text-center">
            <span className="text-[10px] text-muted font-medium uppercase tracking-wide">
              Thất Bại (Lost)
            </span>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {metrics.lostCount}
            </p>
            <span className="text-[10px] text-muted truncate block">
              Mất: {formatVnd(metrics.lostValue)}
            </span>
          </div>
        </div>

        {/* Mini Chart & Reasons */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div className="relative h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={56}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {metrics.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} cơ hội`, String(name)]}
                  contentStyle={{
                    borderRadius: "6px",
                    fontSize: "12px",
                    border: "1px solid #e5e7eb",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-muted">Tỷ lệ</span>
              <span className="text-sm font-bold text-foreground">
                {metrics.winRate}%
              </span>
            </div>
          </div>

          {/* Top Reasons Summary */}
          <div className="space-y-2 text-xs">
            <p className="text-[11px] font-semibold text-foreground">Top lý do chốt deal:</p>
            {metrics.winReasons.slice(0, 2).map((r) => (
              <div key={r.name} className="flex items-center justify-between text-[11px]">
                <span className="text-foreground font-medium truncate max-w-[140px]">
                  [Thắng] {r.name}
                </span>
                <span className="text-muted font-mono">{r.count} deal</span>
              </div>
            ))}
            {metrics.lossReasons.slice(0, 2).map((r) => (
              <div key={r.name} className="flex items-center justify-between text-[11px]">
                <span className="text-muted font-medium truncate max-w-[140px]">
                  [Thua] {r.name}
                </span>
                <span className="text-muted font-mono">{r.count} deal</span>
              </div>
            ))}
            {metrics.winReasons.length === 0 && metrics.lossReasons.length === 0 ? (
              <p className="text-[11px] text-muted italic">Chưa có ghi nhận lý do.</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="pt-2 mt-2 border-t border-border flex items-center justify-between text-[11px] text-muted">
        <span>Tổng cộng: {metrics.totalDeals} cơ hội</span>
        <span>Đang theo đuổi: {metrics.openCount} cơ hội</span>
      </div>
    </section>
  );
}
