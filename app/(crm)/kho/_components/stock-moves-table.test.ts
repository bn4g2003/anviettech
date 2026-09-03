import { describe, expect, it } from "vitest";
import { filterStockMoves } from "./stock-moves-table";

const moves = [
  { id: "in", code: "PN-01", type: "in", status: "posted", supplierId: "supplier-1", customerId: undefined, projectId: undefined, owner: { id: "user-1", name: "Kho" }, lines: [] },
  { id: "out", code: "PX-01", type: "out", status: "posted", supplierId: undefined, customerId: undefined, projectId: "project-1", owner: { id: "user-1", name: "Kho" }, lines: [] },
  { id: "sale", code: "PX-02", type: "out", status: "draft", supplierId: undefined, customerId: "customer-1", projectId: undefined, owner: { id: "user-2", name: "Kinh doanh" }, lines: [] },
] as never[];

describe("filterStockMoves", () => {
  it("filters stock moves by supplier, customer, or project", () => {
    expect(filterStockMoves(moves, "in", { supplierId: "supplier-1" }, "").map((move) => move.id)).toEqual(["in"]);
    expect(filterStockMoves(moves, "out", { projectId: "project-1" }, "").map((move) => move.id)).toEqual(["out"]);
    expect(filterStockMoves(moves, "out", { customerId: "customer-1" }, "").map((move) => move.id)).toEqual(["sale"]);
  });
});
