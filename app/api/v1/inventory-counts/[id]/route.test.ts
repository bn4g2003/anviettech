import { describe, expect, it, vi } from "vitest";

const fixtures = vi.hoisted(() => ({
  count: { id: "count-1", ownerId: "owner-1", lines: [] },
  requirePermission: vi.fn(async () => ({ id: "viewer-1" })),
}));

vi.mock("@/features/auth/services/auth-service", () => ({ requirePermission: fixtures.requirePermission }));
vi.mock("@/features/crm/services/domain-service", () => ({ getInventoryCount: async () => fixtures.count }));

import { GET } from "./route";

describe("GET /api/v1/inventory-counts/[id]", () => {
  it("returns count lines after checking the inventory view scope", async () => {
    const response = await GET(new Request("http://localhost/api/v1/inventory-counts/count-1"), { params: Promise.resolve({ id: "count-1" }) });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, data: fixtures.count });
    expect(fixtures.requirePermission).toHaveBeenCalledWith("inventory", "view", "owner-1");
  });
});
