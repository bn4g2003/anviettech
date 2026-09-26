import { describe, expect, it } from "vitest";
import { businessContextLabel, filterStockMoves } from "./stock-moves-table";

const moves = [
  { id: "in", code: "PN-01", type: "in", status: "posted", supplierId: "supplier-1", customerId: undefined, projectId: undefined, owner: { id: "user-1", name: "Kho" }, createdAt: "2026-09-10T10:00:00Z", lines: [] },
  { id: "out", code: "PX-01", type: "out", status: "posted", supplierId: undefined, customerId: undefined, projectId: "project-1", owner: { id: "user-1", name: "Kho" }, createdAt: "2026-09-15T10:00:00Z", lines: [] },
  { id: "sale", code: "PX-02", type: "out", status: "draft", supplierId: undefined, customerId: "customer-1", projectId: undefined, owner: { id: "user-2", name: "Kinh doanh" }, createdAt: "2026-09-20T10:00:00Z", lines: [] },
] as never[];

describe("filterStockMoves", () => {
  it("filters stock moves by supplier, customer, or project", () => {
    expect(filterStockMoves(moves, "in", { supplierId: "supplier-1" }, "").map((move) => move.id)).toEqual(["in"]);
    expect(filterStockMoves(moves, "out", { projectId: "project-1" }, "").map((move) => move.id)).toEqual(["out"]);
    expect(filterStockMoves(moves, "out", { customerId: "customer-1" }, "").map((move) => move.id)).toEqual(["sale"]);
  });

  it("filters stock moves by warehouse", () => {
    const whMoves = [
      { id: "m1", type: "in", status: "posted", warehouseToId: "wh-1", lines: [] },
      { id: "m2", type: "in", status: "posted", warehouseToId: "wh-2", lines: [] },
      { id: "m3", type: "out", status: "posted", warehouseFromId: "wh-1", lines: [] },
    ] as never[];

    expect(filterStockMoves(whMoves, "in", { warehouseId: "wh-1" }, "").map((m) => m.id)).toEqual(["m1"]);
    expect(filterStockMoves(whMoves, "in", { warehouseId: "wh-2" }, "").map((m) => m.id)).toEqual(["m2"]);
    expect(filterStockMoves(whMoves, "out", { warehouseId: "wh-1" }, "").map((m) => m.id)).toEqual(["m3"]);
  });

  it("filters stock moves by date range (fromDate, toDate)", () => {
    expect(
      filterStockMoves(moves, "out", { fromDate: "2026-09-16", toDate: "2026-09-25" }, "").map(
        (move) => move.id,
      ),
    ).toEqual(["sale"]);
    expect(
      filterStockMoves(moves, "out", { fromDate: "2026-09-01", toDate: "2026-09-15" }, "").map(
        (move) => move.id,
      ),
    ).toEqual(["out"]);
  });

  it("searches across move code, supplier, customer, project, and warehouse", () => {
    const detailedMoves = [
      { id: "1", code: "PN-2026-01", type: "in", status: "posted", supplier: { name: "Công ty Dahua" }, lines: [{ productName: "Camera IP 2MP" }], createdAt: "2026-09-10T10:00:00Z" },
      { id: "2", code: "PX-2026-02", type: "out", status: "posted", customer: { name: "Anh Nam Vincom" }, warehouseFrom: "Kho Tổng Hà Nội", lines: [], createdAt: "2026-09-12T10:00:00Z" },
      { id: "3", code: "PX-2026-03", type: "out", status: "draft", project: { name: "Biệt thự Ecopark" }, lines: [], createdAt: "2026-09-14T10:00:00Z" },
    ] as never[];

    expect(filterStockMoves(detailedMoves, "in", {}, "Dahua").map((m) => m.id)).toEqual(["1"]);
    expect(filterStockMoves(detailedMoves, "in", {}, "Camera").map((m) => m.id)).toEqual(["1"]);
    expect(filterStockMoves(detailedMoves, "out", {}, "Vincom").map((m) => m.id)).toEqual(["2"]);
    expect(filterStockMoves(detailedMoves, "out", {}, "Hà Nội").map((m) => m.id)).toEqual(["2"]);
    expect(filterStockMoves(detailedMoves, "out", {}, "Ecopark").map((m) => m.id)).toEqual(["3"]);
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
