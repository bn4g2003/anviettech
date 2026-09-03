import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const clientQuery = vi.fn(async (sql: string, values: unknown[] = []) => {
    calls.push({ sql, values });
    if (sql.includes("SELECT * FROM invoices")) {
      return { rows: [{ id: "invoice-1", customer_id: "customer-1", amount: "100", paid_amount: "20", status: "partial", owner_id: "owner-1" }] };
    }
    if (sql.includes("INSERT INTO payments")) return { rows: [{ id: "payment-1" }] };
    return { rows: [] };
  });
  const transaction = vi.fn(async (callback: (client: { query: typeof clientQuery }) => Promise<unknown>) => callback({ query: clientQuery }));
  return { calls, clientQuery, transaction };
});

vi.mock("@/lib/db", () => ({ transaction: database.transaction }));
vi.mock("@/features/crm/services/crm-service", () => ({ code: () => "PT-TEST" }));

import { recordPayment } from "./sales-workflow-service";

beforeEach(() => {
  vi.clearAllMocks();
  database.calls.length = 0;
});

describe("recordPayment", () => {
  it("updates linked revenue entries to the same paid ratio as the invoice", async () => {
    await recordPayment({ invoiceId: "invoice-1", amount: 30, method: "cash", paidAt: "2026-09-03" }, "actor-1");

    const sync = database.calls.find(({ sql }) => sql.includes("UPDATE revenue_entries"));
    expect(sync).toBeDefined();
    expect(sync?.values).toEqual([0.5, "actor-1", "invoice-1"]);
  });
});
