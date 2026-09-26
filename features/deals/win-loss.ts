import type { Deal } from "./types";

export const WIN_REASONS = [
  "Giá cạnh tranh / Ưu đãi tốt",
  "Chất lượng giải pháp & thiết bị",
  "Uy tín thương hiệu / Quan hệ tốt",
  "Tiến độ khảo sát & thi công nhanh",
  "Dịch vụ hậu mãi & bảo hành tốt",
  "Khác",
] as const;

export const LOSS_REASONS = [
  "Giá quá cao / Vượt ngân sách",
  "Mất về đối thủ cạnh tranh",
  "Khách hoãn / Hủy kế hoạch",
  "Không đáp ứng yêu cầu kỹ thuật",
  "Tiến độ khảo sát / triển khai chậm",
  "Mất liên lạc / Không phản hồi",
  "Khác",
] as const;

export type WinReason = (typeof WIN_REASONS)[number];
export type LossReason = (typeof LOSS_REASONS)[number];

export interface ParsedClosedReason {
  category: string;
  notes: string;
  competitor?: string;
  actualValue?: number;
  raw: string;
}

export function formatClosedReason(input: {
  category: string;
  notes?: string;
  competitor?: string;
  actualValue?: number;
}): string {
  const parts: string[] = [];
  const cat = input.category.trim();
  if (cat) parts.push(`[${cat}]`);
  if (input.notes?.trim()) parts.push(input.notes.trim());
  if (input.competitor?.trim()) parts.push(`(Đối thủ: ${input.competitor.trim()})`);
  if (typeof input.actualValue === "number" && !isNaN(input.actualValue)) {
    parts.push(`(Giá trị chốt: ${input.actualValue.toLocaleString("vi-VN")} đ)`);
  }
  return parts.join(" ") || "Đã chốt kết quả";
}

export function parseClosedReason(raw?: string | null): ParsedClosedReason {
  if (!raw || !raw.trim()) {
    return { category: "Chưa ghi nhận", notes: "", raw: "" };
  }
  const str = raw.trim();
  const matchCategory = str.match(/^\[(.*?)\]\s*(.*)$/);
  if (matchCategory) {
    const category = matchCategory[1];
    let remaining = matchCategory[2];
    let competitor: string | undefined;
    let actualValue: number | undefined;

    const compMatch = remaining.match(/\(Đối thủ:\s*(.*?)\)/);
    if (compMatch) {
      competitor = compMatch[1];
      remaining = remaining.replace(compMatch[0], "").trim();
    }

    const valMatch = remaining.match(/\(Giá trị chốt:\s*([0-9.,]+)\s*đ\)/);
    if (valMatch) {
      actualValue = Number(valMatch[1].replace(/\./g, "").replace(/,/g, "."));
      remaining = remaining.replace(valMatch[0], "").trim();
    }

    return {
      category,
      notes: remaining,
      competitor,
      actualValue,
      raw: str,
    };
  }

  // Fallback for plain text format
  return {
    category: "Lý do",
    notes: str,
    raw: str,
  };
}

export interface WinLossMetrics {
  totalDeals: number;
  wonCount: number;
  lostCount: number;
  openCount: number;
  winRate: number; // Won / (Won + Lost)
  pipelineRate: number; // Won / Total
  wonValue: number;
  lostValue: number;
  openValue: number;
  totalValue: number;
  pieData: Array<{
    name: string;
    value: number;
    color: string;
    amount: number;
  }>;
  winReasons: Array<{ name: string; count: number; percentage: number }>;
  lossReasons: Array<{ name: string; count: number; percentage: number }>;
}

export function calculateWinLossMetrics(deals: Deal[]): WinLossMetrics {
  let wonCount = 0;
  let lostCount = 0;
  let openCount = 0;
  let wonValue = 0;
  let lostValue = 0;
  let openValue = 0;

  const winReasonCounts: Record<string, number> = {};
  const lossReasonCounts: Record<string, number> = {};

  for (const d of deals) {
    const val = Number(d.value) || 0;
    if (d.stage === "won") {
      wonCount++;
      wonValue += val;
      const parsed = parseClosedReason(d.closedReason);
      const cat = parsed.category || "Khác";
      winReasonCounts[cat] = (winReasonCounts[cat] || 0) + 1;
    } else if (d.stage === "lost") {
      lostCount++;
      lostValue += val;
      const parsed = parseClosedReason(d.closedReason);
      const cat = parsed.category || "Khác";
      lossReasonCounts[cat] = (lossReasonCounts[cat] || 0) + 1;
    } else {
      openCount++;
      openValue += val;
    }
  }

  const totalDeals = deals.length;
  const closedCount = wonCount + lostCount;
  const winRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 1000) / 10 : 0;
  const pipelineRate = totalDeals > 0 ? Math.round((wonCount / totalDeals) * 1000) / 10 : 0;
  const totalValue = wonValue + lostValue + openValue;

  const winReasons = Object.entries(winReasonCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: wonCount > 0 ? Math.round((count / wonCount) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const lossReasons = Object.entries(lossReasonCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: lostCount > 0 ? Math.round((count / lostCount) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const pieData = [
    { name: "Thắng (Won)", value: wonCount, color: "#16a34a", amount: wonValue },
    { name: "Thua (Lost)", value: lostCount, color: "#dc2626", amount: lostValue },
    { name: "Đang xử lý (Open)", value: openCount, color: "#2563eb", amount: openValue },
  ].filter((item) => item.value > 0);

  return {
    totalDeals,
    wonCount,
    lostCount,
    openCount,
    winRate,
    pipelineRate,
    wonValue,
    lostValue,
    openValue,
    totalValue,
    pieData,
    winReasons,
    lossReasons,
  };
}
