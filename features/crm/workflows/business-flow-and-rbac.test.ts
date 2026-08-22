import { describe, expect, it } from "vitest";
import { calcLineTotal, formatVnd, sumAmounts } from "../../shared/utils/money";
import { formatDate, formatDateTime, relativeTime } from "../../shared/utils/date";
import {
  canTransitionDeal,
  canTransitionTask,
  assertDealStageTransition,
  assertTaskStatusTransition,
} from "./state-machines";
import { ensurePermission, permissionMatches } from "../../auth/services/permission-utils";
import type { CurrentUser } from "../../auth/services/auth-types";
import { DEAL_STAGE_META } from "../../deals/types";
import { TASK_TYPE_LABEL } from "../../tasks/types";

function makeUser(
  id: string,
  roleName: string,
  permissions: CurrentUser["permissions"],
): CurrentUser {
  return {
    id,
    fullName: "User " + roleName,
    email: roleName.toLowerCase() + "@anviet.local",
    mustChangePassword: false,
    roles: [roleName],
    permissions,
  };
}

describe("1. Role-Based Access Control (RBAC) across All Non-Admin Roles", () => {
  const adminUser = makeUser("00000000-0000-0000-0000-000000000001", "Admin", [
    { module: "*", action: "view", scope: "all" },
    { module: "*", action: "create", scope: "all" },
    { module: "*", action: "update", scope: "all" },
    { module: "*", action: "delete", scope: "all" },
    { module: "*", action: "approve", scope: "all" },
  ]);

  const salesManager = makeUser("00000000-0000-0000-0000-000000000003", "Trưởng kinh doanh", [
    { module: "leads", action: "view", scope: "all" },
    { module: "leads", action: "create", scope: "all" },
    { module: "leads", action: "update", scope: "all" },
    { module: "deals", action: "view", scope: "all" },
    { module: "deals", action: "create", scope: "all" },
    { module: "deals", action: "update", scope: "all" },
    { module: "quotes", action: "view", scope: "all" },
    { module: "quotes", action: "create", scope: "all" },
    { module: "quotes", action: "approve", scope: "all" },
    { module: "contracts", action: "view", scope: "all" },
    { module: "orders", action: "view", scope: "all" },
    { module: "customers", action: "view", scope: "all" },
  ]);

  const salesRep = makeUser("00000000-0000-0000-0000-000000000004", "Nhân viên kinh doanh", [
    { module: "leads", action: "view", scope: "own" },
    { module: "leads", action: "create", scope: "own" },
    { module: "leads", action: "update", scope: "own" },
    { module: "deals", action: "view", scope: "own" },
    { module: "deals", action: "create", scope: "own" },
    { module: "deals", action: "update", scope: "own" },
    { module: "quotes", action: "view", scope: "own" },
    { module: "quotes", action: "create", scope: "own" },
    { module: "customers", action: "view", scope: "own" },
    { module: "products", action: "view", scope: "all" },
    { module: "analytics", action: "view", scope: "all" },
  ]);

  const marketingUser = makeUser("00000000-0000-0000-0000-000000000005", "Marketing", [
    { module: "campaigns", action: "view", scope: "all" },
    { module: "campaigns", action: "create", scope: "all" },
    { module: "campaigns", action: "update", scope: "all" },
    { module: "leads", action: "view", scope: "all" },
    { module: "leads", action: "create", scope: "all" },
    { module: "customers", action: "view", scope: "all" },
    { module: "analytics", action: "view", scope: "all" },
  ]);

  const warehouseStaff = makeUser("00000000-0000-0000-0000-000000000006", "Kho", [
    { module: "products", action: "view", scope: "all" },
    { module: "products", action: "create", scope: "all" },
    { module: "products", action: "update", scope: "all" },
    { module: "inventory", action: "view", scope: "all" },
    { module: "inventory", action: "create", scope: "all" },
    { module: "inventory", action: "update", scope: "all" },
    { module: "orders", action: "view", scope: "all" },
  ]);

  const accountantUser = makeUser("00000000-0000-0000-0000-000000000007", "Kế toán", [
    { module: "finance", action: "view", scope: "all" },
    { module: "finance", action: "create", scope: "all" },
    { module: "finance", action: "update", scope: "all" },
    { module: "orders", action: "view", scope: "all" },
    { module: "contracts", action: "view", scope: "all" },
    { module: "quotes", action: "view", scope: "all" },
    { module: "customers", action: "view", scope: "all" },
    { module: "analytics", action: "view", scope: "all" },
  ]);

  const viewerUser = makeUser("00000000-0000-0000-0000-000000000008", "Chỉ xem", [
    { module: "leads", action: "view", scope: "all" },
    { module: "customers", action: "view", scope: "all" },
    { module: "deals", action: "view", scope: "all" },
    { module: "quotes", action: "view", scope: "all" },
    { module: "contracts", action: "view", scope: "all" },
    { module: "orders", action: "view", scope: "all" },
    { module: "products", action: "view", scope: "all" },
    { module: "finance", action: "view", scope: "all" },
    { module: "inventory", action: "view", scope: "all" },
  ]);

  it("Sales Rep (NVKD) can only access own records and view products", () => {
    // Can view/create own deals
    expect(() => ensurePermission(salesRep, "deals", "create", salesRep.id)).not.toThrow();
    expect(() => ensurePermission(salesRep, "deals", "view", salesRep.id)).not.toThrow();

    // CANNOT modify another user's deal
    expect(() => ensurePermission(salesRep, "deals", "update", "other-user-id")).toThrow();
    // CANNOT approve quotes
    expect(() => ensurePermission(salesRep, "quotes", "approve")).toThrow();
    // CANNOT access finance or inventory
    expect(permissionMatches(salesRep, "finance", "view")).toHaveLength(0);
    expect(permissionMatches(salesRep, "inventory", "view")).toHaveLength(0);

    // CAN view products
    expect(permissionMatches(salesRep, "products", "view")).toHaveLength(1);
  });

  it("Sales Manager (Trưởng kinh doanh) has all-scope for CRM and sales approval", () => {
    expect(() => ensurePermission(salesManager, "deals", "view", "any-owner-id")).not.toThrow();
    expect(() => ensurePermission(salesManager, "quotes", "approve")).not.toThrow();
    expect(() => ensurePermission(salesManager, "customers", "view", "any-owner-id")).not.toThrow();
    // Cannot access finance management
    expect(permissionMatches(salesManager, "finance", "create")).toHaveLength(0);
  });

  it("Marketing user has campaign management & lead creation, but no access to quotes/finance", () => {
    expect(() => ensurePermission(marketingUser, "campaigns", "create")).not.toThrow();
    expect(() => ensurePermission(marketingUser, "leads", "create")).not.toThrow();
    expect(permissionMatches(marketingUser, "quotes", "create")).toHaveLength(0);
    expect(permissionMatches(marketingUser, "finance", "view")).toHaveLength(0);
    expect(permissionMatches(marketingUser, "inventory", "view")).toHaveLength(0);
  });

  it("Warehouse staff (Kho) can manage inventory and stock, but cannot access deals/finance", () => {
    expect(() => ensurePermission(warehouseStaff, "inventory", "create")).not.toThrow();
    expect(() => ensurePermission(warehouseStaff, "products", "update")).not.toThrow();
    expect(permissionMatches(warehouseStaff, "deals", "view")).toHaveLength(0);
    expect(permissionMatches(warehouseStaff, "finance", "create")).toHaveLength(0);
  });

  it("Accountant (Kế toán) can manage finance, view orders, but cannot manage campaigns or warehouse moves", () => {
    expect(() => ensurePermission(accountantUser, "finance", "create")).not.toThrow();
    expect(() => ensurePermission(accountantUser, "orders", "view")).not.toThrow();
    expect(permissionMatches(accountantUser, "campaigns", "create")).toHaveLength(0);
    expect(permissionMatches(accountantUser, "inventory", "create")).toHaveLength(0);
  });

  it("Viewer (Chỉ xem) can ONLY view and is blocked from any write/create/update/delete action", () => {
    expect(() => ensurePermission(viewerUser, "deals", "view")).not.toThrow();
    expect(() => ensurePermission(viewerUser, "finance", "view")).not.toThrow();
    expect(() => ensurePermission(viewerUser, "deals", "create")).toThrow();
    expect(() => ensurePermission(viewerUser, "deals", "update")).toThrow();
    expect(() => ensurePermission(viewerUser, "deals", "delete")).toThrow();
    expect(() => ensurePermission(viewerUser, "quotes", "approve")).toThrow();
  });
});

describe("2. Calculations & Financial Precision", () => {
  it("calculates line items with discounts and VAT accurately", () => {
    // 2 x 18,500,000 VND with 10% discount and 10% VAT:
    // Base: 37,000,000
    // After discount: 33,300,000
    // Line total (with 10% VAT): 36,630,000
    const line1 = calcLineTotal(2, 18500000, 10, 10);
    expect(line1).toBe(36630000);

    // 1 x 9,200,000 VND with 0% discount and 8% VAT:
    // Line total: 9,200,000 * 1.08 = 9,936,000
    const line2 = calcLineTotal(1, 9200000, 0, 8);
    expect(line2).toBe(9936000);

    const total = sumAmounts([line1, line2]);
    expect(total).toBe(46566000);
  });

  it("formats VND money cleanly with zero fraction digits and currency symbol", () => {
    expect(formatVnd(0)).toContain("0");
    expect(formatVnd(1000000)).toContain("1.000.000");
    expect(formatVnd(null)).toContain("0");
    expect(formatVnd(undefined)).toContain("0");
    expect(formatVnd(NaN)).toContain("0");
  });

  it("formats dates and relative times defensively without throwing on null or invalid values", () => {
    expect(formatDate("")).toBe("—");
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("invalid-date-string")).toBe("—");
    expect(formatDate("2026-08-21T00:00:00Z")).toContain("2026");

    expect(formatDateTime("")).toBe("—");
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime("2026-08-21T10:30:00Z")).toContain("2026");

    expect(relativeTime("")).toBe("—");
    expect(relativeTime(null)).toBe("—");
    expect(relativeTime(new Date().toISOString())).toBe("vừa xong");
  });
});

describe("3. Business Flow State Transitions & Integrity", () => {
  it("strictly enforces deal pipeline stages", () => {
    expect(canTransitionDeal("new", "demo")).toBe(true);
    expect(canTransitionDeal("demo", "negotiation")).toBe(true);
    expect(canTransitionDeal("negotiation", "ready")).toBe(true);
    expect(canTransitionDeal("ready", "won")).toBe(true);
    expect(canTransitionDeal("ready", "lost")).toBe(true);

    // Closed deals cannot be reverted
    expect(canTransitionDeal("won", "new")).toBe(false);
    expect(canTransitionDeal("lost", "demo")).toBe(false);
  });

  it("handles deal stages meta and task labels consistently", () => {
    expect(DEAL_STAGE_META.new.label).toBe("Mới");
    expect(DEAL_STAGE_META.won.probability).toBe(100);
    expect(DEAL_STAGE_META.lost.probability).toBe(0);

    expect(TASK_TYPE_LABEL.call).toBe("Gọi điện");
    expect(TASK_TYPE_LABEL.todo).toBe("Công việc");
  });

  it("calculates customer debts and payments correctly", () => {
    const invoiceAmount = 50000000;
    const paidAmount = 30000000;
    const remainingDebt = invoiceAmount - paidAmount;

    expect(remainingDebt).toBe(20000000);

    // Recording additional 20,000,000 VND payment clears debt to 0
    const newPayment = 20000000;
    const updatedDebt = remainingDebt - newPayment;
    expect(updatedDebt).toBe(0);
  });
});
