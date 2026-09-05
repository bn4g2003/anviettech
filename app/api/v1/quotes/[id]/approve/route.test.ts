import { beforeEach, describe, expect, it, vi } from "vitest";

const fixtures = vi.hoisted(() => ({
  user: { id: "approver-1", roles: ["Trưởng kinh doanh"] as string[] },
  approveQuote: vi.fn(async () => ({ contractId: "contract-1", orderId: "order-1" })),
}));

vi.mock("@/features/auth/services/auth-service", () => ({
  requirePermission: vi.fn(async () => fixtures.user),
}));
vi.mock("@/features/crm/services/domain-service", () => ({
  getQuote: vi.fn(async () => ({ id: "quote-1", ownerId: "owner-1" })),
}));
vi.mock("@/features/sales/services/sales-workflow-service", () => ({
  approveQuote: fixtures.approveQuote,
}));

import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  fixtures.user.roles = ["Trưởng kinh doanh"];
});

describe("POST /api/v1/quotes/[id]/approve", () => {
  it("allows a sales manager to approve a draft directly", async () => {
    const response = await POST(new Request("http://localhost"), { params: Promise.resolve({ id: "quote-1" }) });

    expect(response.status).toBe(200);
    expect(fixtures.approveQuote).toHaveBeenCalledWith("quote-1", "approver-1", { allowDraft: true });
  });

  it("rejects a non-high-level role even if it reaches the approval route", async () => {
    fixtures.user.roles = ["Nhân viên kinh doanh"];

    const response = await POST(new Request("http://localhost"), { params: Promise.resolve({ id: "quote-1" }) });

    expect(response.status).toBe(403);
    expect(fixtures.approveQuote).not.toHaveBeenCalled();
  });
});
