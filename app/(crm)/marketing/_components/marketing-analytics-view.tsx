"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMarketing, useMarketingAnalytics } from "@/features/marketing/hooks/use-marketing";
import { formatVnd } from "@/features/shared/utils/money";
import { formatDate } from "@/features/shared/utils/date";
import {
  Trophy,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  Target,
  ExternalLink,
  Search,
  Filter,
  BarChart2,
  PieChart as PieIcon,
  Loader2,
  Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export function MarketingAnalyticsView() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("all_marketing");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { rows: campaigns } = useMarketing();
  const { data, loading } = useMarketingAnalytics({
    campaignId: selectedCampaignId || undefined,
    source: selectedSource !== "all_marketing" ? selectedSource : undefined,
  });

  // Filter customers by search term
  const filteredCustomers = useMemo(() => {
    if (!data?.customers) return [];
    if (!searchTerm.trim()) return data.customers;
    const term = searchTerm.toLowerCase();
    return data.customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term)) ||
        (c.source && c.source.toLowerCase().includes(term)) ||
        (c.campaignName && c.campaignName.toLowerCase().includes(term)),
    );
  }, [data?.customers, searchTerm]);

  // Win/Loss Pie Chart Data
  const pieData = useMemo(() => {
    if (!data) return [];
    const items = [
      { name: "Thắng (Won)", value: data.wonDeals, color: "#171717" },
      { name: "Thua (Lost)", value: data.lostDeals, color: "#737373" },
      { name: "Đang chăm sóc", value: data.openDeals, color: "#d4d4d4" },
    ].filter((item) => item.value > 0);
    return items;
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-muted">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Đang tổng hợp dữ liệu hiệu quả Marketing & Phễu chuyển đổi...
      </div>
    );
  }

  const maxFunnelCount = Math.max(...(data?.funnel.map((f) => f.count) ?? [1]), 1);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-white p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Filter className="h-3.5 w-3.5 text-muted" />
            <span>Lọc phân tích:</span>
          </div>

          <div className="w-56">
            <Select
              className="h-8 text-xs"
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
            >
              <option value="">Tất cả chiến dịch MKT</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-44">
            <Select
              className="h-8 text-xs"
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
            >
              <option value="all_marketing">Tất cả nguồn MKT</option>
              <option value="Website">Website</option>
              <option value="Marketing">Marketing chung</option>
              <option value="Quảng cáo">Quảng cáo (Ads)</option>
              <option value="Facebook">Facebook</option>
              <option value="Google">Google Ads</option>
              <option value="Zalo">Zalo</option>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted">
            Tổng cộng: <strong className="text-foreground">{data?.totalCustomers ?? 0}</strong> KH từ MKT
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Marketing Customers */}
        <div className="rounded-lg border border-border bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Khách hàng từ MKT</span>
            <Users className="h-4 w-4 text-muted" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {data?.totalCustomers ?? 0}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            Thu hút qua chiến dịch & kênh online
          </p>
        </div>

        {/* Marketing Leads */}
        <div className="rounded-lg border border-border bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Tiềm năng (Leads)</span>
            <Target className="h-4 w-4 text-muted" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {data?.totalLeads ?? 0}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            Đã chuyển đổi: <span className="font-semibold text-foreground">{data?.convertedLeads ?? 0}</span> lead
          </p>
        </div>

        {/* Win Rate */}
        <div className="rounded-lg border border-border bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Tỷ lệ Thắng (Win Rate)</span>
            <Trophy className="h-4 w-4 text-muted" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {data?.winRate ?? 0}%
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            {data?.wonDeals ?? 0} thắng / {(data?.wonDeals ?? 0) + (data?.lostDeals ?? 0)} cơ hội đã chốt
          </p>
        </div>

        {/* Total Revenue */}
        <div className="rounded-lg border border-border bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Doanh số từ MKT</span>
            <TrendingUp className="h-4 w-4 text-muted" />
          </div>
          <p className="mt-2 text-xl font-bold text-foreground truncate">
            {formatVnd(data?.totalRevenue ?? 0)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted truncate">
            Từ {data?.wonDeals ?? 0} hợp đồng chốt thắng
          </p>
        </div>
      </div>

      {/* Row: Win/Loss Rate & Sales Funnel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Win / Loss Widget */}
        <div className="rounded-lg border border-border bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Tỷ lệ chuyển đổi Thắng / Thua</h3>
              <p className="text-xs text-muted">Đánh giá kết quả các cơ hội phát sinh từ Marketing</p>
            </div>
            <PieIcon className="h-4 w-4 text-muted" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Recharts Pie */}
            <div className="h-44 w-full">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [`${val} cơ hội`, name]}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e5e5e5",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted">
                  Chưa có dữ liệu cơ hội
                </div>
              )}
            </div>

            {/* Breakdown stats */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between rounded border border-border/60 bg-neutral-50 px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-neutral-900" />
                  <span className="font-medium text-foreground">Thắng (Won)</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-foreground">{data?.wonDeals ?? 0}</span>
                  <span className="ml-1 text-[11px] text-muted">({data?.winRate ?? 0}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded border border-border/60 bg-neutral-50 px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-neutral-500" />
                  <span className="font-medium text-foreground">Thất bại (Lost)</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-foreground">{data?.lostDeals ?? 0}</span>
                  <span className="ml-1 text-[11px] text-muted">({data?.lossRate ?? 0}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded border border-border/60 bg-neutral-50 px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                  <span className="font-medium text-foreground">Đang xử lý</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-foreground">{data?.openDeals ?? 0}</span>
                  <span className="ml-1 text-[11px] text-muted">cơ hội</span>
                </div>
              </div>

              <div className="pt-1 text-[11px] text-muted">
                Tổng cộng có <strong className="text-foreground">{data?.totalDeals ?? 0}</strong> cơ hội liên quan đến khách hàng từ Marketing.
              </div>
            </div>
          </div>
        </div>

        {/* Marketing Funnel Widget */}
        <div className="rounded-lg border border-border bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Phễu cơ hội khách hàng</h3>
              <p className="text-xs text-muted">Tiến trình chuyển đổi từ Tiềm năng MKT đến Chốt đơn</p>
            </div>
            <Layers className="h-4 w-4 text-muted" />
          </div>

          <div className="space-y-2.5 pt-1">
            {data?.funnel.map((step, idx) => {
              const pct = Math.round((step.count / maxFunnelCount) * 100);
              const opacities = ["bg-foreground/30", "bg-foreground/50", "bg-foreground/70", "bg-foreground/85", "bg-foreground"];
              const barClass = opacities[idx] || "bg-foreground";

              return (
                <div key={step.id} className="space-y-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-medium text-foreground">{step.label}</span>
                    <div className="flex items-center gap-2 text-muted tabular-nums">
                      <span className="font-semibold text-foreground">{step.count}</span>
                      {step.value > 0 ? (
                        <span className="text-[11px] text-muted">· {formatVnd(step.value)}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted-bg">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${barClass}`}
                      style={{ width: `${Math.max(pct, step.count > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Marketing Customers List Section */}
      <div className="rounded-lg border border-border bg-white shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Danh sách Khách hàng từ Marketing</h3>
            <p className="text-xs text-muted">
              Theo dõi chi tiết khách hàng và hiệu quả chuyển đổi đơn hàng
            </p>
          </div>

          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
            <Input
              placeholder="Tìm theo tên, mã KH, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="flex h-36 items-center justify-center text-xs text-muted">
            Không tìm thấy khách hàng nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface text-muted uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="px-3 py-2.5 whitespace-nowrap">Mã KH</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Khách hàng</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Nguồn / Kênh</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Chiến dịch</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Phụ trách</th>
                  <th className="px-3 py-2.5 text-center whitespace-nowrap">Số Deal</th>
                  <th className="px-3 py-2.5 text-center whitespace-nowrap">Thắng / Thua</th>
                  <th className="px-3 py-2.5 text-right whitespace-nowrap">Doanh thu chốt</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Ngày tạo</th>
                  <th className="px-3 py-2.5 text-center whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-surface/60 transition-colors">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Link
                        href={`/khach-hang/${c.id}`}
                        className="font-mono text-xs font-semibold text-primary hover:underline"
                      >
                        {c.code}
                      </Link>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Link
                        href={`/khach-hang/${c.id}`}
                        className="font-medium text-foreground hover:underline block max-w-[200px] truncate"
                        title={c.name}
                      >
                        {c.name}
                      </Link>
                      {c.phone ? (
                        <span className="text-[11px] text-muted block">{c.phone}</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-block rounded bg-muted-bg px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                        {c.source || "Marketing"}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-muted">
                      {c.campaignName || "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-muted">
                      {c.ownerName || "—"}
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap font-mono tabular-nums">
                      {c.dealsCount}
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-mono text-xs">
                        <span className="font-semibold text-foreground">{c.wonDealsCount}</span>
                        <span className="text-muted">/</span>
                        <span className="text-muted">{c.lostDealsCount}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap font-mono font-semibold text-foreground">
                      {formatVnd(c.wonDealValue)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-muted">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <Link
                        href={`/khach-hang/${c.id}`}
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                      >
                        <span>Chi tiết</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
