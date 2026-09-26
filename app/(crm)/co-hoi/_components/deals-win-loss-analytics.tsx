"use client";

import { useDeals } from "@/features/deals/hooks/use-deals";
import { calculateWinLossMetrics } from "@/features/deals/win-loss";
import { formatVnd } from "@/features/shared/utils/money";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import {
  Trophy,
  XCircle,
  Clock,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Percent,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export function DealsWinLossAnalytics() {
  const list = useListPage();
  const { rows, loading } = useDeals({
    ownerId: list.filters.ownerId,
    customerId: list.filters.customerId,
  });

  const metrics = calculateWinLossMetrics(rows);

  if (loading && rows.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-muted">
        Đang tổng hợp dữ liệu tỷ lệ thắng / thua...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Win Rate */}
        <div className="rounded-lg border border-border bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">
              Tỷ lệ Thắng (Win Rate)
            </span>
            <Trophy className="h-4 w-4 text-muted" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {metrics.winRate}%
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            {metrics.wonCount} thắng / {metrics.wonCount + metrics.lostCount} đã chốt
          </p>
        </div>

        {/* Loss Rate */}
        <div className="rounded-lg border border-border bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">
              Tỷ lệ Thua (Loss Rate)
            </span>
            <XCircle className="h-4 w-4 text-muted" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-600">
            {metrics.lossRate}%
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            {metrics.lostCount} thua / {metrics.wonCount + metrics.lostCount} đã chốt
          </p>
        </div>

        {/* Won Value */}
        <div className="rounded-lg border border-border bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">
              Doanh thu Thắng
            </span>
            <TrendingUp className="h-4 w-4 text-muted" />
          </div>
          <p className="mt-2 text-xl font-bold text-foreground truncate">
            {formatVnd(metrics.wonValue)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            Từ {metrics.wonCount} cơ hội thành công
          </p>
        </div>

        {/* Lost Deals */}
        <div className="rounded-lg border border-border bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">
              Cơ hội Thất bại (Lost)
            </span>
            <XCircle className="h-4 w-4 text-muted" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {metrics.lostCount}
          </p>
          <p className="mt-0.5 text-[11px] text-muted truncate">
            Giá trị mất: {formatVnd(metrics.lostValue)}
          </p>
        </div>

        {/* Open Pipeline */}
        <div className="rounded-lg border border-border bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">
              Đang chăm sóc (Open)
            </span>
            <Clock className="h-4 w-4 text-muted" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {metrics.openCount}
          </p>
          <p className="mt-0.5 text-[11px] text-muted truncate">
            Tiềm năng: {formatVnd(metrics.openValue)}
          </p>
        </div>

        {/* Total & Pipeline conversion */}
        <div className="rounded-lg border border-border bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">
              Chuyển đổi Phễu
            </span>
            <Percent className="h-4 w-4 text-muted" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {metrics.pipelineRate}%
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            Tổng {metrics.totalDeals} cơ hội toàn bộ
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Donut Chart: Win / Loss / Open Distribution */}
        <div className="rounded-lg border border-border bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2.5 border-b border-border">
              <PieIcon className="h-4 w-4 text-muted" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Tỷ Lệ Phân Bổ Thắng / Thua
                </h3>
                <p className="text-xs text-muted">
                  Cơ cấu trạng thái toàn bộ cơ hội bán hàng
                </p>
              </div>
            </div>

            <div className="relative h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={74}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {metrics.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [
                      `${val} cơ hội`,
                      String(name),
                    ]}
                    contentStyle={{
                      borderRadius: "6px",
                      fontSize: "12px",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Centered Win/Loss Rate Badge */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-muted">Thắng</span>
                <span className="text-base font-bold text-emerald-600">
                  {metrics.winRate}%
                </span>
                <span className="text-[10px] text-muted mt-0.5">Thua</span>
                <span className="text-base font-bold text-rose-600">
                  {metrics.lossRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="space-y-1.5 pt-3 border-t border-border text-xs">
            {metrics.pieData.map((item) => {
              const pct =
                metrics.totalDeals > 0
                  ? ((item.value / metrics.totalDeals) * 100).toFixed(1)
                  : "0";
              return (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-foreground">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {item.value} deal
                    </span>
                    <span className="w-12 text-right text-muted font-mono text-[11px]">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Win Reasons */}
        <div className="rounded-lg border border-border bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2.5 border-b border-border">
              <BarChart3 className="h-4 w-4 text-muted" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Phân Tích Lý Do Thắng ({metrics.wonCount} deal)
                </h3>
                <p className="text-xs text-muted">
                  Yếu tố cốt lõi giúp chốt hợp đồng thành công
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-2.5">
              {metrics.winReasons.length > 0 ? (
                metrics.winReasons.map((r) => (
                  <div key={r.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground truncate max-w-[200px]" title={r.name}>
                        {r.name}
                      </span>
                      <span className="text-muted font-mono">
                        {r.count} deal ({r.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted-bg">
                      <div
                        className="h-full rounded-full bg-neutral-800"
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-xs text-muted">
                  Chưa có dữ liệu lý do thắng.
                </p>
              )}
            </div>
          </div>
          <div className="pt-2 border-t border-border text-[11px] text-muted">
            Ghi chú: Tận dụng điểm mạnh giá và chất lượng để nhân bản cho các khách hàng mới.
          </div>
        </div>

        {/* Top Loss Reasons */}
        <div className="rounded-lg border border-border bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2.5 border-b border-border">
              <BarChart3 className="h-4 w-4 text-muted" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Phân Tích Lý Do Thua ({metrics.lostCount} deal)
                </h3>
                <p className="text-xs text-muted">
                  Nguyên nhân thất bại & bài học kinh nghiệm
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-2.5">
              {metrics.lossReasons.length > 0 ? (
                metrics.lossReasons.map((r) => (
                  <div key={r.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground truncate max-w-[200px]" title={r.name}>
                        {r.name}
                      </span>
                      <span className="text-muted font-mono">
                        {r.count} deal ({r.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted-bg">
                      <div
                        className="h-full rounded-full bg-neutral-500"
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-xs text-muted">
                  Chưa có dữ liệu lý do thua.
                </p>
              )}
            </div>
          </div>
          <div className="pt-2 border-t border-border text-[11px] text-muted">
            Ghi chú: Rà soát lý do mất về đối thủ hoặc giá cao để tối ưu chính sách báo giá.
          </div>
        </div>
      </div>
    </div>
  );
}
