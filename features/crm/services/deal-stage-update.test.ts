import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const query = vi.fn(async (sql: string, values: unknown[] = []) => {
    calls.push({ sql, values });
    if (sql.startsWith("SELECT id, code, title") && sql.includes("FROM deals")) return { rows: [{ id: "deal-1", stage: "new", ownerId: "owner-1" }] };
    return { rows: [] };
  });
  return { calls, query, transaction: vi.fn() };
});

vi.mock("@/lib/db", () => ({ query: database.query, transaction: database.transaction }));
vi.mock("@/features/crm/services/crm-service", () => ({ code: () => "TEST" }));
vi.mock("@/features/crm/services/relation-guards", () => ({ assertContactBelongsToCustomer: vi.fn(), assertCustomerExists: vi.fn(), assertDealBelongsToCustomer: vi.fn(), assertLinkedEntitiesConsistent: vi.fn(), DOCUMENT_ENTITY_TYPES: new Set(), resolveDocumentEntityOwner: vi.fn() }));
vi.mock("@/features/crm/workflows/state-machines", () => ({ assertDealStageTransition: vi.fn(), assertTaskStatusTransition: vi.fn() }));
vi.mock("@/features/auth/services/permission-utils", () => ({ hasScopeAll: vi.fn() }));

import { changeDealStage } from "./domain-service";

beforeEach(() => { vi.clearAllMocks(); database.calls.length = 0; });

describe("changeDealStage", () => {
  it("uses independent SQL parameters for stage and terminal probability", async () => {
    await changeDealStage("deal-1", "qualified", undefined, "actor-1");

    const update = database.calls.find(({ sql }) => sql.startsWith("UPDATE deals SET stage"));
    expect(update?.sql).not.toContain("CASE WHEN $1");
    expect(update?.values).toEqual(["qualified", null, null, "actor-1", "deal-1"]);
  });
});
