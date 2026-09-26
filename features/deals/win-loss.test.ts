import { describe, expect, it } from "vitest";
import {
  formatClosedReason,
  parseClosedReason,
  calculateWinLossMetrics,
  WIN_REASONS,
  LOSS_REASONS,
} from "./win-loss";
import type { Deal } from "./types";

describe("win-loss utilities", () => {
  it("formats and parses win reason with actual value and notes", () => {
    const formatted = formatClosedReason({
      category: "Giá cạnh tranh / Ưu đãi tốt",
      notes: "Khách chốt gói 4 camera IP",
      actualValue: 15000000,
    });

    expect(formatted).toContain("[Giá cạnh tranh / Ưu đãi tốt]");
    expect(formatted).toContain("Khách chốt gói 4 camera IP");
    expect(formatted).toContain("15.000.000 đ");

    const parsed = parseClosedReason(formatted);
    expect(parsed.category).toBe("Giá cạnh tranh / Ưu đãi tốt");
    expect(parsed.notes).toContain("Khách chốt gói 4 camera IP");
    expect(parsed.actualValue).toBe(15000000);
  });

  it("formats and parses loss reason with competitor", () => {
    const formatted = formatClosedReason({
      category: "Mất về đối thủ cạnh tranh",
      notes: "Đối thủ giảm giá 20%",
      competitor: "Viettel Construction",
    });

    expect(formatted).toContain("[Mất về đối thủ cạnh tranh]");
    expect(formatted).toContain("(Đối thủ: Viettel Construction)");

    const parsed = parseClosedReason(formatted);
    expect(parsed.category).toBe("Mất về đối thủ cạnh tranh");
    expect(parsed.competitor).toBe("Viettel Construction");
    expect(parsed.notes).toBe("Đối thủ giảm giá 20%");
  });

  it("gracefully parses legacy unstructured plain text", () => {
    const parsed = parseClosedReason("đã lắp đặt xong");
    expect(parsed.category).toBe("Lý do");
    expect(parsed.notes).toBe("đã lắp đặt xong");
  });

  it("calculates win/loss metrics correctly", () => {
    const sampleDeals: Deal[] = [
      {
        id: "d1",
        code: "CH-1",
        title: "Deal 1",
        customerId: "c1",
        stage: "won",
        value: 10000000,
        probability: 100,
        owner: { id: "o1", name: "KD1" },
        expectedCloseDate: "2026-09-30",
        productIds: [],
        closedReason: "[Giá cạnh tranh / Ưu đãi tốt] Khách ưng giá",
        createdAt: "2026-09-01",
        updatedAt: "2026-09-20",
      },
      {
        id: "d2",
        code: "CH-2",
        title: "Deal 2",
        customerId: "c2",
        stage: "won",
        value: 20000000,
        probability: 100,
        owner: { id: "o1", name: "KD1" },
        expectedCloseDate: "2026-09-30",
        productIds: [],
        closedReason: "[Chất lượng giải pháp & thiết bị] Khách chọn gói cao cấp",
        createdAt: "2026-09-01",
        updatedAt: "2026-09-20",
      },
      {
        id: "d3",
        code: "CH-3",
        title: "Deal 3",
        customerId: "c3",
        stage: "lost",
        value: 15000000,
        probability: 0,
        owner: { id: "o1", name: "KD1" },
        expectedCloseDate: "2026-09-30",
        productIds: [],
        closedReason: "[Giá quá cao / Vượt ngân sách] Không đủ kinh phí",
        createdAt: "2026-09-01",
        updatedAt: "2026-09-20",
      },
      {
        id: "d4",
        code: "CH-4",
        title: "Deal 4",
        customerId: "c4",
        stage: "negotiation",
        value: 30000000,
        probability: 50,
        owner: { id: "o1", name: "KD1" },
        expectedCloseDate: "2026-10-15",
        productIds: [],
        createdAt: "2026-09-10",
        updatedAt: "2026-09-20",
      },
    ];

    const metrics = calculateWinLossMetrics(sampleDeals);
    expect(metrics.totalDeals).toBe(4);
    expect(metrics.wonCount).toBe(2);
    expect(metrics.lostCount).toBe(1);
    expect(metrics.openCount).toBe(1);
    // Win rate: 2 / (2 + 1) = 66.7%
    expect(metrics.winRate).toBe(66.7);
    // Loss rate: 1 / (2 + 1) = 33.3%
    expect(metrics.lossRate).toBe(33.3);
    // Pipeline conversion rate: 2 / 4 = 50%
    expect(metrics.pipelineRate).toBe(50);
    expect(metrics.wonValue).toBe(30000000);
    expect(metrics.lostValue).toBe(15000000);
    expect(metrics.openValue).toBe(30000000);
    expect(metrics.winReasons.length).toBe(2);
    expect(metrics.lossReasons.length).toBe(1);
  });
});
