import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-client", () => ({
  apiFetch,
  toQuery: (params: Record<string, string | number | undefined | null>) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
    }
    return `?${search.toString()}`;
  },
}));

import { productsService } from "./products-service";

const product = (id: string) => ({
  id,
  sku: `SKU-${id}`,
  name: `Sản phẩm ${id}`,
  unit: "cái",
  unitPrice: 0,
  vatPercent: 0,
  minStock: 0,
  status: "active",
});

describe("productsService.list", () => {
  beforeEach(() => apiFetch.mockReset());

  it("loads every API page instead of truncating the catalogue at one page", async () => {
    apiFetch
      .mockResolvedValueOnce({ data: [product("one")], meta: { totalPages: 2 } })
      .mockResolvedValueOnce({ data: [product("two")], meta: { totalPages: 2 } });

    const rows = await productsService.list({ status: "active" });

    expect(rows.map((row) => row.id)).toEqual(["one", "two"]);
    expect(apiFetch).toHaveBeenNthCalledWith(1, "/api/v1/products?status=active&page=1&pageSize=1000");
    expect(apiFetch).toHaveBeenNthCalledWith(2, "/api/v1/products?status=active&page=2&pageSize=1000");
  });
});
