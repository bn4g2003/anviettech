import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ apiFetch: vi.fn(), toQuery: vi.fn(() => "") }));
vi.mock("@/lib/api-client", () => api);
vi.mock("@/features/shared/api/owners", () => ({ loadOwners: vi.fn(async () => []), ownerByIdSync: vi.fn(() => ({ id: "owner-1", name: "Owner" })) }));

import { dealsService } from "./deals-service";

beforeEach(() => { vi.clearAllMocks(); });

describe("dealsService.update", () => {
  it("persists a changed stage through the dedicated stage endpoint", async () => {
    api.apiFetch
      .mockResolvedValueOnce({ data: { id: "deal-1", code: "CH-1", title: "Cơ hội", customerId: "customer-1", stage: "new", value: 0, probability: 10 } })
      .mockResolvedValueOnce({ data: { id: "deal-1", code: "CH-1", title: "Cơ hội", customerId: "customer-1", stage: "demo", value: 0, probability: 30 } });

    await dealsService.update("deal-1", { stage: "demo", reason: "Đã hoàn tất buổi demo" });

    expect(api.apiFetch).toHaveBeenCalledWith("/api/v1/deals/deal-1/stage", expect.objectContaining({ method: "POST", body: JSON.stringify({ stage: "demo", reason: "Đã hoàn tất buổi demo" }) }));
  });
});
