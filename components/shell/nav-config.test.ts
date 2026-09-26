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

  it("gives marketing users access to marketing views without phan-tich", () => {
    const views = getRoleQuickViews({
      id: "marketing-user", fullName: "Marketing", email: "marketing@example.test", mustChangePassword: false,
      roles: ["Marketing"], permissions: [],
    });

    expect(views.map((view) => view.href)).toEqual([
      "/marketing", "/marketing?tab=analytics", "/tiem-nang",
    ]);
    expect(views.some((v) => v.href.includes("/phan-tich"))).toBe(false);
  });
});
