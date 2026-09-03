import { describe, expect, it } from "vitest";
import {
  customerSchema,
  leadCreateSchema,
  leadConvertSchema,
  quoteSchema,
  paymentSchema,
  dealStageSchema,
  documentSchema,
  taskSchema,
  dealSchema,
  contractSchema,
  stockMoveSchema,
  projectSchema,
  projectUpdateSchema,
  supplierSchema,
  warehouseSchema,
  serialNumberSchema,
  productSupplierSchema,
  inventoryCountSchema,
  operatingExpenseSchema,
  revenueEntrySchema,
  revenueReductionSchema,
  financeReportFilterSchema,
} from "./validation";

describe("CRM validation", () => {
  it("validates customerSchema with empty, undefined, and valid UUID ownerId", () => {
    const validWithUuid = customerSchema.safeParse({
      name: "Công ty ABC",
      type: "company",
      ownerId: "11111111-1111-4111-8111-111111111111",
    });
    expect(validWithUuid.success).toBe(true);
    if (validWithUuid.success) {
      expect(validWithUuid.data.ownerId).toBe("11111111-1111-4111-8111-111111111111");
    }

    const validWithEmpty = customerSchema.safeParse({
      name: "Công ty XYZ",
      type: "company",
      ownerId: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    });
    expect(validWithEmpty.success).toBe(true);
    if (validWithEmpty.success) {
      expect(validWithEmpty.data.ownerId).toBeUndefined();
    }

    const invalidUuid = customerSchema.safeParse({
      name: "Công ty 123",
      type: "company",
      ownerId: "invalid-uuid",
    });
    expect(invalidUuid.success).toBe(false);
  });

  it("validates taskSchema and dealSchema with empty ownerId", () => {
    const task = taskSchema.safeParse({
      title: "Gọi điện",
      type: "call",
      ownerId: "",
    });
    expect(task.success).toBe(true);
    if (task.success) {
      expect(task.data.ownerId).toBeUndefined();
    }

    const deal = dealSchema.safeParse({
      title: "Cơ hội 1",
      customerId: "11111111-1111-4111-8111-111111111111",
      ownerId: "",
    });
    expect(deal.success).toBe(true);
    if (deal.success) {
      expect(deal.data.ownerId).toBeUndefined();
    }
  });

  it("requires deal title when converting with deal", () => {
    const result = leadConvertSchema.safeParse({
      customerName: "ABC",
      createDeal: true,
    });
    expect(result.success).toBe(false);
  });

  it("accepts quote with lines", () => {
    const result = quoteSchema.safeParse({
      customerId: "11111111-1111-4111-8111-111111111111",
      lines: [{ productId: "22222222-2222-4222-8222-222222222222", qty: 1, unitPrice: 1000 }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a manual contract and normalizes empty linked IDs", () => {
    const result = contractSchema.safeParse({
      customerId: "11111111-1111-4111-8111-111111111111",
      quoteId: "",
      dealId: "",
      status: "draft",
      value: 1500000,
      ownerId: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quoteId).toBeUndefined();
      expect(result.data.ownerId).toBeUndefined();
    }
  });

  it("validates payment method", () => {
    expect(
      paymentSchema.safeParse({
        invoiceId: "11111111-1111-4111-8111-111111111111",
        amount: 100,
        method: "transfer",
        paidAt: new Date().toISOString(),
      }).success,
    ).toBe(true);
    expect(
      paymentSchema.safeParse({
        invoiceId: "11111111-1111-4111-8111-111111111111",
        amount: 100,
        method: "bitcoin",
        paidAt: new Date().toISOString(),
      }).success,
    ).toBe(false);
  });

  it("accepts deal stage", () => {
    expect(dealStageSchema.safeParse({ stage: "won", reason: "Chốt" }).success).toBe(true);
  });

  it("allowlists document entity types", () => {
    expect(
      documentSchema.safeParse({
        entityType: "customer",
        entityId: "11111111-1111-4111-8111-111111111111",
        originalName: "a.pdf",
        storageKey: "k",
        mimeType: "application/pdf",
        sizeBytes: 10,
      }).success,
    ).toBe(true);
    expect(
      documentSchema.safeParse({
        entityType: "random",
        entityId: "11111111-1111-4111-8111-111111111111",
        originalName: "a.pdf",
        storageKey: "k",
        mimeType: "application/pdf",
        sizeBytes: 10,
      }).success,
    ).toBe(false);
  });

  it("accepts a stable client request ID for a stock move", () => {
    const result = stockMoveSchema.safeParse({
        type: "in",
        reason: "purchase_receipt",
        warehouseToId: "11111111-1111-4111-8111-111111111111",
        supplierId: "44444444-4444-4444-8444-444444444444",
        requestId: "22222222-2222-4222-8222-222222222222",
        lines: [{ productId: "33333333-3333-4333-8333-333333333333", qty: 1 }],
      });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.requestId).toBe("22222222-2222-4222-8222-222222222222");
    }
  });

  it("requires the matching business counterpart for stock move reasons", () => {
    const base = { warehouseFromId: "11111111-1111-4111-8111-111111111111", lines: [{ productId: "33333333-3333-4333-8333-333333333333", qty: 1 }] };
    expect(stockMoveSchema.safeParse({ ...base, type: "out", reason: "installation_issue" }).success).toBe(false);
    expect(stockMoveSchema.safeParse({ ...base, type: "out", reason: "sales_issue", customerId: "22222222-2222-4222-8222-222222222222" }).success).toBe(true);
  });

  it("validates serials and a non-negative stock count", () => {
    expect(serialNumberSchema.safeParse({ productId: "11111111-1111-4111-8111-111111111111", serial: "SN-001" }).success).toBe(true);
    expect(inventoryCountSchema.safeParse({ warehouseId: "11111111-1111-4111-8111-111111111111", lines: [{ productId: "22222222-2222-4222-8222-222222222222", countedQty: -1 }] }).success).toBe(false);
  });

  it("accepts a product supplier with a non-negative reference purchase price", () => {
    expect(productSupplierSchema.safeParse({ supplierId: "11111111-1111-4111-8111-111111111111", purchasePrice: 0, minOrderQty: 1 }).success).toBe(true);
    expect(productSupplierSchema.safeParse({ supplierId: "11111111-1111-4111-8111-111111111111", purchasePrice: -1 }).success).toBe(false);
  });

  it("requires a positive operating expense amount", () => {
    expect(operatingExpenseSchema.safeParse({ category: "salary", amount: 100, expenseDate: "2026-01-01" }).success).toBe(true);
    expect(operatingExpenseSchema.safeParse({ category: "salary", amount: 0, expenseDate: "2026-01-01" }).success).toBe(false);
  });

  it("validates revenue detail and prevents paid amount above its total", () => {
    const entry = { occurredAt: "2026-09-03", customerId: "11111111-1111-4111-8111-111111111111", productId: "22222222-2222-4222-8222-222222222222", businessType: "retail" as const, qty: 2, unitPrice: 100, vatPercent: 10, costAmount: 120, paymentStatus: "partial" as const, paidAmount: 100 };
    expect(revenueEntrySchema.safeParse(entry).success).toBe(true);
    expect(revenueEntrySchema.safeParse({ ...entry, paidAmount: 221 }).success).toBe(false);
  });

  it("requires a customer or revenue detail for a reduction", () => {
    expect(revenueReductionSchema.safeParse({ occurredAt: "2026-09-03", type: "discount", amount: 100 }).success).toBe(false);
    expect(revenueReductionSchema.safeParse({ occurredAt: "2026-09-03", type: "discount", amount: 100, revenueEntryId: "11111111-1111-4111-8111-111111111111" }).success).toBe(true);
  });

  it("accepts finance report filters and rejects an inverted date range", () => {
    expect(financeReportFilterSchema.safeParse({ from: "2026-01-01", to: "2026-01-31" }).success).toBe(true);
    expect(financeReportFilterSchema.safeParse({ from: "2026-02-01", to: "2026-01-31" }).success).toBe(false);
  });

  it("validates suppliers and projects at the API boundary", () => {
    expect(supplierSchema.safeParse({ name: "Nhà cung cấp An Việt", email: "sales@example.com" }).success).toBe(true);
    expect(supplierSchema.safeParse({ name: "A", email: "khong-phai-email" }).success).toBe(false);

    expect(projectSchema.safeParse({
      name: "Lắp đặt nhà máy A",
      customerId: "11111111-1111-4111-8111-111111111111",
      startDate: "2026-09-01",
      endDate: "2026-09-30",
    }).success).toBe(true);
    expect(projectSchema.safeParse({
      name: "Lắp đặt nhà máy A",
      customerId: "11111111-1111-4111-8111-111111111111",
      startDate: "2026-09-30",
      endDate: "2026-09-01",
    }).success).toBe(false);

    expect(supplierSchema.partial().safeParse({ status: "inactive" }).success).toBe(true);
    expect(projectUpdateSchema.safeParse({ status: "active" }).success).toBe(true);
  });

  it("validates a warehouse and rejects an empty code", () => {
    expect(warehouseSchema.safeParse({ code: "KHO-HN", name: "Kho Hà Nội", isDefault: true }).success).toBe(true);
    expect(warehouseSchema.safeParse({ code: "", name: "Kho Hà Nội" }).success).toBe(false);
  });
});
