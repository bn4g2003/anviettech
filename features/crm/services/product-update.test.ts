import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const query = vi.fn(async (sql: string, values: unknown[] = []) => {
    calls.push({ sql, values });
    if (sql.startsWith("UPDATE products SET")) return { rows: [{ id: "product-1" }] };
    return { rows: [] };
  });
  return { calls, query, transaction: vi.fn() };
});

vi.mock("@/lib/db", () => ({ query: database.query, transaction: database.transaction }));
vi.mock("@/features/crm/services/crm-service", () => ({ code: () => "TEST" }));
vi.mock("@/features/crm/services/relation-guards", () => ({ assertContactBelongsToCustomer: vi.fn(), assertCustomerExists: vi.fn(), assertDealBelongsToCustomer: vi.fn(), assertLinkedEntitiesConsistent: vi.fn(), DOCUMENT_ENTITY_TYPES: new Set(), resolveDocumentEntityOwner: vi.fn() }));
vi.mock("@/features/crm/workflows/state-machines", () => ({ assertDealStageTransition: vi.fn(), assertTaskStatusTransition: vi.fn() }));
vi.mock("@/features/auth/services/permission-utils", () => ({ hasScopeAll: vi.fn() }));

import { updateProduct } from "./domain-service";

beforeEach(() => { vi.clearAllMocks(); database.calls.length = 0; });

describe("updateProduct", () => {
  it("sets service minimum stock without reusing the item-type SQL parameter", async () => {
    await updateProduct("product-1", { itemType: "service", minStock: 10 }, "actor-1");

    const update = database.calls.find(({ sql }) => sql.startsWith("UPDATE products SET"));
    expect(update?.sql).not.toContain("CASE WHEN $11");
    expect(update?.values?.[7]).toBe(0);
  });
});
