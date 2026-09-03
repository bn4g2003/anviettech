import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const fixtures = vi.hoisted(() => ({
  allow: true,
  calls: [] as string[],
}));

vi.mock("@/features/auth/services/auth-service", () => ({
  requirePermission: async () => {
    if (!fixtures.allow) throw Object.assign(new Error("Bạn không có quyền xem dữ liệu này"), { status: 403 });
    return { id: "user" };
  },
}));
vi.mock("@/lib/db", () => ({
  query: async (sql: string) => { fixtures.calls.push(sql); return { rows: [{ sku: "SP-01", name: "Sản phẩm" }] }; },
}));

import { GET } from "./route";

beforeEach(() => { fixtures.allow = true; fixtures.calls.length = 0; });

describe("GET /api/v1/inventory/reports", () => {
  it.each(["stock", "moves", "projects", "warranty"])("returns the supported %s report", async (kind) => {
    const response = await GET(new NextRequest(`http://localhost/api/v1/inventory/reports?kind=${kind}`));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, data: [{ sku: "SP-01" }] });
    expect(fixtures.calls).toHaveLength(1);
  });

  it("rejects an unknown report kind before querying data", async () => {
    const response = await GET(new NextRequest("http://localhost/api/v1/inventory/reports?kind=all"));
    expect(response.status).toBe(422);
    expect(fixtures.calls).toEqual([]);
  });

  it("rejects an invalid report date before querying data", async () => {
    const response = await GET(new NextRequest("http://localhost/api/v1/inventory/reports?kind=moves&from=not-a-date"));

    expect(response.status).toBe(422);
    expect(fixtures.calls).toEqual([]);
  });
});
