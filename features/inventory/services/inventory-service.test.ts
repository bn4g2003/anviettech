import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-client", () => ({
  apiFetch,
  toQuery: () => "",
}));
vi.mock("@/features/shared/api/owners", () => ({
  loadOwners: async () => [],
  ownerByIdSync: () => ({ id: "", name: "" }),
}));

import { inventoryService } from "./inventory-service";

beforeEach(() => apiFetch.mockReset());

describe("inventoryService.createMove", () => {
  it("sends the chosen warehouse IDs and one stable request ID without silently selecting another warehouse", async () => {
    apiFetch.mockResolvedValue({
      data: {
        id: "move-1", code: "PN-1", type: "in", status: "draft", ownerId: "owner-1",
        warehouseToId: "warehouse-selected", lines: [], createdAt: "2026-09-03T00:00:00.000Z",
      },
    });

    await inventoryService.createMove({
      type: "in",
      reason: "purchase_receipt",
      status: "draft",
      requestId: "11111111-1111-4111-8111-111111111111",
      warehouseTo: "warehouse-selected",
      supplierId: "33333333-3333-4333-8333-333333333333",
      note: "Nhập kiểm tra",
      lines: [{ productId: "22222222-2222-4222-8222-222222222222", qty: 2 }],
    });

    expect(apiFetch).toHaveBeenCalledWith("/api/v1/stock-moves", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        type: "in",
        reason: "purchase_receipt",
        requestId: "11111111-1111-4111-8111-111111111111",
        warehouseFromId: undefined,
        warehouseToId: "warehouse-selected",
        supplierId: "33333333-3333-4333-8333-333333333333",
        customerId: undefined,
        projectId: undefined,
        note: "Nhập kiểm tra",
        post: false,
        lines: [{ productId: "22222222-2222-4222-8222-222222222222", qty: 2 }],
      }),
    }));
  });

  it("identifies stock level 0 as low stock / belowMin by default even if minStock is 0", async () => {
    apiFetch.mockResolvedValue({
      data: [
        {
          warehouseId: "wh-1",
          productId: "prod-zero",
          sku: "CAM-01",
          productName: "Camera 0 tồn",
          minStock: 0,
          qty: 0,
          belowMin: true,
        },
        {
          warehouseId: "wh-1",
          productId: "prod-available",
          sku: "CAM-02",
          productName: "Camera có hàng",
          minStock: 0,
          qty: 10,
          belowMin: false,
        },
      ],
    });

    const lowItems = await inventoryService.lowStock();
    expect(lowItems).toHaveLength(1);
    expect(lowItems[0].productId).toBe("prod-zero");
    expect(lowItems[0].belowMin).toBe(true);
  });
});
