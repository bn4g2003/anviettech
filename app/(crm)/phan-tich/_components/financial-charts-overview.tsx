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
  // Map category icons monochromatic
  const getCategoryIcon = (name: string) => {
    if (name.includes("Thi công")) return <HardHat className="h-3.5 w-3.5 text-muted" />;
    if (name.includes("Sửa chữa")) return <Wrench className="h-3.5 w-3.5 text-muted" />;
    if (name.includes("Bảo hành")) return <ShieldCheck className="h-3.5 w-3.5 text-muted" />;
    return <ShoppingCart className="h-3.5 w-3.5 text-muted" />;
  };

  const totalRev = revenueBreakdown.reduce((sum, item) => sum + item.value, 0);
  const totalExp = expenseBreakdown.reduce((sum, item) => sum + item.value, 0);

  // Clean monochromatic palette for breakdown charts
  const MONO_COLORS = ["#171717", "#525252", "#737373", "#a3a3a3", "#d4d4d4", "#78716c", "#44403c"];

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {/* Chart 1: Monthly Financial Trend */}
      <div className="lg:col-span-2 rounded-md border border-border bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Xu Hướng Doanh Thu, Chi Phí & Lãi Ròng Hàng Tháng
              </h3>
              <p className="text-xs text-muted">
                So sánh Doanh thu (1), Giá vốn (2), Chi phí (4) và Lãi ròng (5)
              </p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyOverview} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="monthName" tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis
                tickLine={false}
                tickFormatter={(v) => `${Math.round(v / 1e6)}M`}
                tick={{ fontSize: 11, fill: "#6b7280" }}
              />
              <Tooltip
                formatter={(val) => formatVnd(Number(val ?? 0))}
                labelStyle={{ fontWeight: "bold" }}
                contentStyle={{ borderRadius: "6px", fontSize: "12px", border: "1px solid #e5e7eb" }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Bar dataKey="revenue" name="Doanh Thu" fill="#171717" radius={[2, 2, 0, 0]} maxBarSize={24} />
              <Bar dataKey="cogs" name="Giá Vốn" fill="#737373" radius={[2, 2, 0, 0]} maxBarSize={24} />
              <Bar dataKey="expenses" name="Chi Phí" fill="#d4d4d4" radius={[2, 2, 0, 0]} maxBarSize={24} />
              <Line dataKey="netProfit" name="Lãi Ròng" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Revenue Breakdown */}
      <div className="rounded-md border border-border bg-white p-4 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 pb-2.5 border-b border-border">
            <PieIcon className="h-4 w-4 text-muted" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Cơ Cấu Doanh Thu Hoạt Động
              </h3>
              <p className="text-xs text-muted">
                Thi công, Sửa chữa, Bảo hành & Bán lẻ
              </p>
            </div>
          </div>

          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {revenueBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={MONO_COLORS[index % MONO_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => formatVnd(Number(val ?? 0))}
                  contentStyle={{ borderRadius: "6px", fontSize: "12px", border: "1px solid #e5e7eb" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legend list */}
        <div className="space-y-1.5 pt-2 border-t border-border text-xs">
          {revenueBreakdown.map((item, index) => {
            const pct = totalRev > 0 ? ((item.value / totalRev) * 100).toFixed(1) : "0";
            return (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: MONO_COLORS[index % MONO_COLORS.length] }} />
                  {getCategoryIcon(item.name)}
                  <span className="truncate text-foreground font-medium">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {formatVnd(item.value)}
                  </span>
                  <span className="w-10 text-right text-muted font-mono text-[11px]">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart 3: Operating Expenses Breakdown */}
      <div className="lg:col-span-3 rounded-md border border-border bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Phân Bổ Các Khoản Chi Phí Vận Hành
              </h3>
              <p className="text-xs text-muted">
                Chi tiết 7 khoản mục chi phí theo báo cáo tài chính
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted">Tổng Chi Phí:</span>
            <p className="text-sm font-bold text-foreground">{formatVnd(totalExp)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-3">
          {expenseBreakdown.map((item, index) => {
            const pct = totalExp > 0 ? ((item.value / totalExp) * 100).toFixed(1) : "0";
            return (
              <div
                key={item.name}
                className="rounded-md border border-border bg-neutral-50/70 p-2.5"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: MONO_COLORS[index % MONO_COLORS.length] }} />
                  <span className="text-xs font-medium text-muted truncate">
                    {item.name}
                  </span>
                </div>
                <p className="text-xs font-bold text-foreground">
                  {formatVnd(item.value)}
                </p>
                <p className="text-[11px] font-mono text-muted mt-0.5">
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
