import { describe, expect, it } from "vitest";
import { ensurePermission, permissionMatches } from "./permission-utils";
import type { CurrentUser } from "./auth-types";

function user(permissions: CurrentUser["permissions"]): CurrentUser {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    fullName: "Tester",
    email: "t@example.com",
    mustChangePassword: false,
    roles: ["NVKD"],
    permissions,
  };
}

describe("permissionMatches", () => {
  it("matches module and wildcard permissions", () => {
    const own = user([{ module: "tasks", action: "update", scope: "own" }]);
    expect(permissionMatches(own, "tasks", "update")).toHaveLength(1);
    expect(permissionMatches(own, "tasks", "delete")).toHaveLength(0);

    const admin = user([{ module: "*", action: "update", scope: "all" }]);
    expect(permissionMatches(admin, "tasks", "update")).toHaveLength(1);
  });
});

describe("ensurePermission", () => {
  it("allows own records only for the record owner", () => {
    const own = user([{ module: "tasks", action: "create", scope: "own" }]);
    expect(() => ensurePermission(own, "tasks", "create", own.id)).not.toThrow();
    expect(() => ensurePermission(own, "tasks", "create", "22222222-2222-4222-8222-222222222222")).toThrow();
  });
});
