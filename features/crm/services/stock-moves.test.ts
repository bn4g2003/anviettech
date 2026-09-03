import { beforeEach, describe, expect, it, vi } from "vitest";

// The fake models PostgreSQL visibility: another connection cannot read a
// newly inserted move until its creating transaction has committed.
const database = vi.hoisted(() => {
  type Row = Record<string, unknown>;
  const state = {
    committed: false,
    move: null as Row | null,
    lines: [] as Row[],
    missingProduct: false,
    serviceProduct: false,
  };
  const result = (rows: Row[]) => ({ rows, rowCount: rows.length });

  function read(sql: string, canSeeUncommitted: boolean) {
    const visible = state.committed || canSeeUncommitted;
    if (sql.includes("FROM stock_moves ")) {
      return result(visible && state.move ? [{ ...state.move }] : []);
    }
    if (sql.includes("FROM stock_move_lines ")) {
      return result(visible ? state.lines.map((line) => ({ ...line })) : []);
    }
    throw new Error(`Unexpected read in stock-move fake: ${sql}`);
  }

  const query = vi.fn(async (sql: string) => read(sql, false));
  const clientQuery = vi.fn(async (sql: string, values: unknown[] = []) => {
    if (sql.includes("FROM warehouses ")) {
      return result((values[0] as string[]).map((id) => ({ id })));
    }
    if (sql.includes("FROM suppliers ")) return result([{ id: values[0] }]);
    if (sql.includes("INSERT INTO stock_moves(")) {
      state.move = {
        id: "00000000-0000-4000-8000-000000000100",
        code: values[0],
        type: values[1],
        reason: values[2],
        status: "draft",
        warehouseFromId: values[3],
        warehouseToId: values[4],
        ownerId: values[8],
        note: values[9],
        orderId: null,
        postedAt: null,
      };
      return result([{ ...state.move }]);
    }
    if (sql.includes("FROM products ")) {
      return result(state.missingProduct ? [] : [{ name: "Camera test", item_type: state.serviceProduct ? "service" : "goods" }]);
    }
    if (sql.includes("INSERT INTO stock_move_lines(")) {
      state.lines.push({
        id: "00000000-0000-4000-8000-000000000101",
        productId: values[1],
        productName: values[2],
        qty: String(values[3]),
      });
      return result([]);
    }
    if (sql.includes("INSERT INTO audit_logs(")) return result([]);
    return read(sql, true);
  });
  const transaction = vi.fn(async (callback: (client: { query: typeof clientQuery }) => Promise<unknown>) => {
    try {
      const value = await callback({ query: clientQuery });
      state.committed = true;
      return value;
    } catch (error) {
      state.move = null;
      state.lines = [];
      state.committed = false;
      throw error;
    }
  });

  return { state, query, transaction, clientQuery };
});

// Never load lib/db or establish a database connection in these unit tests.
vi.mock("@/lib/db", () => ({ query: database.query, transaction: database.transaction }));

import { createStockMove } from "./domain-service";

const ownerId = "00000000-0000-4000-8000-000000000010";
const warehouseId = "00000000-0000-4000-8000-000000000020";
const productId = "00000000-0000-4000-8000-000000000030";
const supplierId = "00000000-0000-4000-8000-000000000040";

beforeEach(() => {
  vi.clearAllMocks();
  database.state.committed = false;
  database.state.move = null;
  database.state.lines = [];
  database.state.missingProduct = false;
  database.state.serviceProduct = false;
});

describe("createStockMove transaction visibility", () => {
  it("returns the persisted draft and its lines after the creating transaction commits", async () => {
    const move = await createStockMove({
      type: "in",
      reason: "purchase_receipt",
      supplierId,
      warehouseToId: warehouseId,
      note: "Nhập thử local",
      lines: [{ productId, qty: 3 }],
      post: false,
    }, ownerId);

    expect(database.state.committed).toBe(true);
    expect(move).toMatchObject({
      id: "00000000-0000-4000-8000-000000000100",
      status: "draft",
      ownerId,
      warehouseToId: warehouseId,
      lines: [{ productId, productName: "Camera test", qty: "3" }],
    });
    expect(database.clientQuery.mock.calls.some(([sql]) => String(sql).includes("WHERE request_id IS NOT NULL AND deleted_at IS NULL DO NOTHING"))).toBe(true);
  });

  it("rolls back the move when a line refers to a missing product", async () => {
    database.state.missingProduct = true;

    await expect(createStockMove({
      type: "in",
      reason: "purchase_receipt",
      supplierId,
      warehouseToId: warehouseId,
      lines: [{ productId, qty: 3 }],
    }, ownerId)).rejects.toMatchObject({ status: 422 });

    expect(database.state.committed).toBe(false);
    expect(database.state.move).toBeNull();
    expect(database.state.lines).toEqual([]);
  });

  it("rejects services before they can affect inventory balances", async () => {
    database.state.serviceProduct = true;

    await expect(createStockMove({
      type: "in",
      reason: "purchase_receipt",
      supplierId,
      warehouseToId: warehouseId,
      lines: [{ productId, qty: 1 }],
    }, ownerId)).rejects.toMatchObject({ status: 422, message: "Dịch vụ không thể đưa vào phiếu kho" });

    expect(database.state.move).toBeNull();
  });
});
