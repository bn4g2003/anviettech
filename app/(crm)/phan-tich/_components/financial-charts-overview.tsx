"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatVnd } from "@/features/shared/utils/money";
import { TrendingUp, PieChart as PieIcon, BarChart3, Wrench, ShieldCheck, ShoppingCart, HardHat } from "lucide-react";

export type MonthlyOverviewItem = {
  month: number;
  monthName: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
};

export type CategoryBreakdownItem = {
  name: string;
  value: number;
  color: string;
};

interface FinancialChartsOverviewProps {
  monthlyOverview: MonthlyOverviewItem[];
  revenueBreakdown: CategoryBreakdownItem[];
  expenseBreakdown: CategoryBreakdownItem[];
}

export function FinancialChartsOverview({
  monthlyOverview,
  revenueBreakdown,
  expenseBreakdown,
}: FinancialChartsOverviewProps) {
  // Format tooltips in chart
  const formatChartValue = (value: number) => formatVnd(value);

  // Map category icons
  const getCategoryIcon = (name: string) => {
    if (name.includes("Thi công")) return <HardHat className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    if (name.includes("Sửa chữa")) return <Wrench className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
    if (name.includes("Bảo hành")) return <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
    return <ShoppingCart className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />;
  };

  const totalRev = revenueBreakdown.reduce((sum, item) => sum + item.value, 0);
  const totalExp = expenseBreakdown.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Chart 1: Monthly Financial Trend (Spans 2 columns on lg) */}
      <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Xu Hướng Doanh Thu, Chi Phí & Lãi Ròng Hàng Tháng
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                So sánh Doanh thu (1), Giá vốn (2), Chi phí (4) và Lãi ròng (5)
              </p>
            </div>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyOverview} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="monthName" tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis
                tickLine={false}
                tickFormatter={(v) => `${Math.round(v / 1e6)}M`}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(val) => formatVnd(Number(val ?? 0))}
                labelStyle={{ fontWeight: "bold" }}
                contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              <Bar dataKey="revenue" name="Doanh Thu" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="cogs" name="Giá Vốn" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="expenses" name="Chi Phí" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Line dataKey="netProfit" name="Lãi Ròng" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Revenue Breakdown by Business Type */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <PieIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Cơ Cấu Doanh Thu Hoạt Động
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Thi công, Sửa chữa, Bảo hành & Bán lẻ
              </p>
            </div>
          </div>

          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {revenueBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => formatVnd(Number(val ?? 0))}
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legend list */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {revenueBreakdown.map((item) => {
            const pct = totalRev > 0 ? ((item.value / totalRev) * 100).toFixed(1) : "0";
            return (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  {getCategoryIcon(item.name)}
                  <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatVnd(item.value)}
                  </span>
                  <span className="w-10 text-right text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart 3: Operating Expenses Breakdown (Full width or bottom row) */}
      <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Phân Bổ Các Khoản Chi Phí Vận Hành (Lương, Thuê VP, Thuế, Phòng KT & Khác)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chi tiết 7 khoản mục chi phí theo báo cáo
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400">Tổng Chi Phí:</span>
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatVnd(totalExp)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-4">
          {expenseBreakdown.map((item) => {
            const pct = totalExp > 0 ? ((item.value / totalExp) * 100).toFixed(1) : "0";
            return (
              <div
                key={item.name}
                className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/50"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
                    {item.name}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {formatVnd(item.value)}
                </p>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                  {pct}% tổng chi phí
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
