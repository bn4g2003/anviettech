import { describe, expect, it } from "vitest";
import { getRoleQuickViews } from "./nav-config";

describe("getRoleQuickViews", () => {
  it("gives warehouse users direct access to all five inventory catalogues", () => {
    const views = getRoleQuickViews({
      id: "warehouse-user", fullName: "Kho", email: "warehouse@example.test", mustChangePassword: false,
      roles: ["Kho"], permissions: [],
    });

    expect(views.map((view) => view.label)).toEqual([
      "Hàng hóa", "Nhà cung cấp", "Khách hàng", "Kho bãi", "Công trình",
    ]);
  });
});
