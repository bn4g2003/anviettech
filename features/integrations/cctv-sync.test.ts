import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

vi.mock("@/lib/db", () => ({
  query: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/lib/cctv-db", () => ({
  isCctvConfigured: vi.fn(() => true),
  queryCctv: vi.fn(),
}));

import { ensurePermission, permissionMatches } from "../auth/services/permission-utils";
import type { CurrentUser } from "../auth/services/auth-types";
import { detectCustomerType, mapBusinessType, type SyncPreviewData } from "./services/cctv-sync-service";

function mockUser(permissions: CurrentUser["permissions"], roles: string[] = ["Nhân viên"]): CurrentUser {
  return {
    id: "user-1111-2222-3333",
    fullName: "Nguyễn Văn Test",
    email: "test@anviet.local",
    mustChangePassword: false,
    roles,
    permissions,
  };
}

describe("CCTV Integration - RBAC & Permissions", () => {
  it("rejects users who do not have integrations:sync permission", () => {
    const salesUser = mockUser([
      { module: "customers", action: "view", scope: "all" },
      { module: "customers", action: "create", scope: "own" },
    ]);

    expect(permissionMatches(salesUser, "integrations", "sync")).toHaveLength(0);
    expect(() => ensurePermission(salesUser, "integrations", "sync")).toThrow(
      "Bạn không có quyền thực hiện thao tác này",
    );
  });

  it("allows users who have integrations:sync permission", () => {
    const managerUser = mockUser([
      { module: "customers", action: "view", scope: "all" },
      { module: "integrations", action: "sync", scope: "all" },
    ]);

    expect(permissionMatches(managerUser, "integrations", "sync")).toHaveLength(1);
    expect(() => ensurePermission(managerUser, "integrations", "sync")).not.toThrow();
  });

  it("allows super admin with wildcard module", () => {
    const superAdmin = mockUser(
      [{ module: "*", action: "sync", scope: "all" }],
      ["Super admin"],
    );

    expect(permissionMatches(superAdmin, "integrations", "sync")).toHaveLength(1);
    expect(() => ensurePermission(superAdmin, "integrations", "sync")).not.toThrow();
  });
});

describe("CCTV Integration - Business Logic & Lean Mapping", () => {
  it("detects company customer type correctly", () => {
    const companyNames = [
      "Công ty TNHH Cơ điện Hà Nội",
      "Công Ty CP Đầu Tư An Phát",
      "Doanh nghiệp Tư nhân Nam Anh",
      "Tập đoàn Viễn thông ABC",
      "Công ty Cổ phần Xây dựng 1",
    ];

    const individualNames = [
      "Nguyễn Văn Tuấn",
      "Anh Hoàng - Times City",
      "Chị Mai Linh Đàm",
      "Bác Bình (Căn 1204)",
    ];

    for (const name of companyNames) {
      expect(detectCustomerType(name)).toBe("company");
    }

    for (const name of individualNames) {
      expect(detectCustomerType(name)).toBe("individual");
    }
  });

  it("maps CCTV work order types to 4 CRM P&L business types accurately", () => {
    expect(mapBusinessType("installation")).toBe("new_construction");
    expect(mapBusinessType("add_on")).toBe("new_construction");
    expect(mapBusinessType("warranty")).toBe("warranty");
    expect(mapBusinessType("maintenance")).toBe("repair");
    expect(mapBusinessType("maintenance_repair")).toBe("repair");
    expect(mapBusinessType("relocation")).toBe("repair");
    expect(mapBusinessType("other")).toBe("repair");
  });

  it("constructs valid SyncPreviewData structure for UI preview and commit", () => {
    const mockPreview: SyncPreviewData = {
      customers: {
        toCreate: [
          {
            cctvId: "cctv-1",
            name: "Anh Tuấn",
            phone: "0901234567",
            contactName: "Tuấn",
            address: "Hà Nội",
            notes: "Ghi chú",
            type: "individual",
            contacts: [
              { name: "Anh Tuấn", phone: "0901234567", isPrimary: true },
            ],
          },
        ],
        toUpdate: [
          {
            id: "crm-1",
            cctvId: "cctv-2",
            currentName: "Công ty Cũ",
            phone: "0909999999",
            address: "Hải Phòng",
            notes: "",
            contacts: [],
          },
        ],
      },
      workOrders: [
        {
          cctvId: "wo-1",
          code: "WO-001",
          cctvCustomerId: "cctv-1",
          customerName: "Anh Tuấn",
          businessType: "new_construction",
          subtotal: 5000000,
          vatRate: 10,
          vatAmount: 500000,
          totalAmount: 5500000,
          costAmount: 3000000,
          paidAmount: 5500000,
          debtAmount: 0,
          paymentStatus: "paid",
          paymentMethod: "bank_transfer",
          description: "Lắp đặt 4 camera",
          occurredAt: "2026-09-01",
          materials: [
            { name: "Camera Dahua 2MP", quantity: 4, unitPrice: 750000, lineTotal: 3000000 },
          ],
        },
      ],
      summary: {
        newCustomersCount: 1,
        updateCustomersCount: 1,
        newOrdersCount: 1,
        totalRevenue: 5500000,
        totalPaid: 5500000,
        totalDebt: 0,
      },
      scannedAt: new Date().toISOString(),
    };

    expect(mockPreview.summary.newCustomersCount).toBe(1);
    expect(mockPreview.summary.totalRevenue).toBe(5500000);
    expect(mockPreview.summary.totalPaid).toBe(5500000);
    expect(mockPreview.summary.totalDebt).toBe(0);
    expect(mockPreview.workOrders[0].businessType).toBe("new_construction");
    expect(mockPreview.workOrders[0].materials).toHaveLength(1);
  });
});

describe("CCTV Integration - Migration 012 & 013 Safety", () => {
  it("migration 012 adds additive columns and permissions without deleting data", () => {
    const sql = readFileSync(new URL("../../database/migrations/012_cctv_integration_sync.sql", import.meta.url), "utf8");

    // Must be purely additive
    expect(sql).not.toMatch(/DROP\s+TABLE/i);
    expect(sql).not.toMatch(/TRUNCATE/i);
    expect(sql).not.toMatch(/DELETE\s+FROM\s+(customers|orders|revenue_entries|tasks)/i);

    // Must add cctv linking columns
    expect(sql).toMatch(/cctv_customer_id/i);
    expect(sql).toMatch(/cctv_work_order_id/i);
    expect(sql).toMatch(/cctv_sync_logs/i);
    expect(sql).toMatch(/'integrations'/i);
  });

  it("migration 013 adds cctv_work_order_id to orders, invoices, and payments", () => {
    const sql = readFileSync(new URL("../../database/migrations/013_cctv_financial_sync.sql", import.meta.url), "utf8");

    expect(sql).not.toMatch(/DROP\s+TABLE/i);
    expect(sql).toMatch(/ALTER TABLE orders ADD COLUMN IF NOT EXISTS cctv_work_order_id/i);
    expect(sql).toMatch(/ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cctv_work_order_id/i);
    expect(sql).toMatch(/ALTER TABLE payments ADD COLUMN IF NOT EXISTS cctv_work_order_id/i);
  });
});

