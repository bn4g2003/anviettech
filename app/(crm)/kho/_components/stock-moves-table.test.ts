import { describe, expect, it } from "vitest";
import { businessContextLabel, filterStockMoves } from "./stock-moves-table";

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

describe("businessContextLabel", () => {
  it("shows the supplier, customer, or project stored on a stock move", () => {
    expect(businessContextLabel({
      supplier: { id: "supplier-1", code: "NCC-01", name: "Nhà cung cấp A" },
    } as never)).toBe("NCC-01 — Nhà cung cấp A");
    expect(businessContextLabel({
      customer: { id: "customer-1", code: "KH-01", name: "Khách hàng B" },
    } as never)).toBe("KH-01 — Khách hàng B");
    expect(businessContextLabel({
      project: { id: "project-1", code: "CT-01", name: "Công trình C" },
    } as never)).toBe("CT-01 — Công trình C");
  });
});
