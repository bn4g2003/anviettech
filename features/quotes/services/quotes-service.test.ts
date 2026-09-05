import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const apiFetch = vi.fn(async (path: string, init?: RequestInit) => {
    calls.push({ path, init });
    if (path === "/api/v1/quotes/quote-1") {
      return { data: { id: "quote-1", code: "BG-1", customerId: "customer-1", status: "approved", subtotal: 100, total: 100, lines: [] } };
    }
    return { data: {} };
  });
  return { calls, apiFetch };
});

vi.mock("@/lib/api-client", () => ({ apiFetch: api.apiFetch, toQuery: () => "" }));
vi.mock("@/features/shared/api/owners", () => ({ loadOwners: vi.fn(async () => []), ownerByIdSync: () => ({ id: "owner-1", name: "Owner" }) }));

import { quotesService } from "./quotes-service";

beforeEach(() => { vi.clearAllMocks(); api.calls.length = 0; });

describe("quotesService.update", () => {
  it("approves a sent quote without trying to edit its locked content", async () => {
    await quotesService.update("quote-1", {
      status: "approved",
      terms: "Thanh toán ngay",
      lines: [{ productId: "product-1", qty: 1, unitPrice: 100, discountPercent: 0, vatPercent: 0 }],
    }, "sent");

    expect(api.calls.some(({ path, init }) => path === "/api/v1/quotes/quote-1" && init?.method === "PATCH")).toBe(false);
    expect(api.calls.some(({ path, init }) => path === "/api/v1/quotes/quote-1/approve" && init?.method === "POST")).toBe(true);
  });
});
