import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@/features/auth/services/auth-types";

const fixtures = vi.hoisted(() => ({
  user: {
    id: "00000000-0000-4000-8000-000000000010",
    fullName: "Warehouse tester",
    email: "warehouse@example.test",
    mustChangePassword: false,
    roles: ["Kho"],
    permissions: [] as CurrentUser["permissions"],
  },
  createdMoves: [] as Record<string, unknown>[],
}));

vi.mock("@/features/auth/services/auth-service", async () => {
  const { ensurePermission } = await import("@/features/auth/services/permission-utils");
  return {
    requireBusinessUser: async () => fixtures.user,
    resolveOwnerForCreate: async (user: CurrentUser, module: string, action: string, ownerId: string) => {
      ensurePermission(user, module, action, ownerId);
      return ownerId;
    },
    requirePermission: async (module: string, action: string, ownerId?: string | null) => {
      ensurePermission(fixtures.user, module, action, ownerId);
      return fixtures.user;
    },
    ensurePermission,
  };
});

vi.mock("@/features/crm/services/domain-service", () => ({
  createStockMove: async (input: { post?: boolean }, ownerId: string) => {
    const move = { id: "move-test", ...input, ownerId, status: input.post ? "posted" : "draft" };
    fixtures.createdMoves.push(move);
    return move;
  },
}));

// The GET handler is unrelated to creation; do not load its database dependency.
vi.mock("@/features/crm/services/list-handler", () => ({ listHandler: vi.fn() }));

import { POST } from "./route";

function request(post?: boolean) {
  return new Request("http://localhost/api/v1/stock-moves", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "in",
      reason: "purchase_receipt",
      warehouseToId: "00000000-0000-4000-8000-000000000020",
      supplierId: "00000000-0000-4000-8000-000000000040",
      lines: [{ productId: "00000000-0000-4000-8000-000000000030", qty: 3 }],
      ...(post === undefined ? {} : { post }),
    }),
  });
}

beforeEach(() => {
  fixtures.user.permissions = [{ module: "inventory", action: "create", scope: "own" }];
  fixtures.createdMoves.length = 0;
});

describe("POST /api/v1/stock-moves permissions", () => {
  it.each([false, undefined])("allows create-only users to create a draft when post is %s", async (post) => {
    const response = await POST(request(post));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, data: { status: "draft" } });
    expect(fixtures.createdMoves).toHaveLength(1);
  });

  it("rejects immediate posting without approve permission and creates no move", async () => {
    const response = await POST(request(true));

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ success: false });
    expect(fixtures.createdMoves).toEqual([]);
  });

  it.each(["own", "all"] as const)("allows immediate posting with create and approve:%s permission", async (scope) => {
    fixtures.user.permissions.push({ module: "inventory", action: "approve", scope });
    const response = await POST(request(true));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, data: { status: "posted", ownerId: fixtures.user.id } });
    expect(fixtures.createdMoves).toHaveLength(1);
  });

  it("does not let approve permission replace the required create permission", async () => {
    fixtures.user.permissions = [{ module: "inventory", action: "approve", scope: "all" }];
    const response = await POST(request(true));

    expect(response.status).toBe(403);
    expect(fixtures.createdMoves).toEqual([]);
  });
});
