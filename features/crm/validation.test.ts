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
});
