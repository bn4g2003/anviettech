import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  let quoteStatus = "draft";
  const client = {
    query: vi.fn(async (sql: string, values: unknown[] = []) => {
      calls.push({ sql, values });
      if (sql.startsWith("SELECT * FROM quotes")) return { rows: [{ id: "quote-1", customer_id: "customer-1", deal_id: null, owner_id: "owner-1", total: "100", status: quoteStatus, terms: null }] };
      if (sql.startsWith("INSERT INTO contracts")) return { rows: [{ id: "contract-1" }] };
      if (sql.startsWith("INSERT INTO orders")) return { rows: [{ id: "order-1" }] };
      return { rows: [] };
    }),
  };
  return { calls, setQuoteStatus: (status: string) => { quoteStatus = status; }, transaction: vi.fn(async (callback: (client: typeof client) => unknown) => callback(client)) };
});

vi.mock("@/lib/db", () => ({ transaction: database.transaction }));
vi.mock("@/features/crm/services/crm-service", () => ({ code: () => "TEST" }));

import { approveQuote } from "./sales-workflow-service";

beforeEach(() => { vi.clearAllMocks(); database.calls.length = 0; database.setQuoteStatus("draft"); });

describe("approveQuote", () => {
  it("allows an explicitly authorized direct approval from draft", async () => {
    await approveQuote("quote-1", "approver-1", { allowDraft: true });

    expect(database.calls.some(({ sql }) => sql.startsWith("UPDATE quotes SET status='approved'"))).toBe(true);
  });

  it("keeps the ordinary approval flow restricted to sent quotes", async () => {
    await expect(approveQuote("quote-1", "approver-1")).rejects.toThrow("Chỉ duyệt báo giá đã gửi");
  });
});
