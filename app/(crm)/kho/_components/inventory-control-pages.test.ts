import { describe, expect, it } from "vitest";
import { countDifference, filterSerials } from "./inventory-control-pages";

describe("filterSerials", () => {
  const rows = [
    { id: "1", serial: "BH-001", productId: "p1", status: "warranty" },
    { id: "2", serial: "HU-001", productId: "p2", status: "damaged" },
    { id: "3", serial: "OK-001", productId: "p1", status: "in_stock" },
  ];
  const products = [
    { id: "p1", sku: "SP-1", name: "Biến tần", itemType: "goods" as const, status: "active" },
    { id: "p2", sku: "SP-2", name: "Dây cáp", itemType: "goods" as const, status: "active" },
  ];

  it("filters the warranty and damaged serial statuses separately", () => {
    expect(filterSerials(rows, products, "", "warranty").map((row) => row.id)).toEqual(["1"]);
    expect(filterSerials(rows, products, "", "damaged").map((row) => row.id)).toEqual(["2"]);
  });

  it("still searches by serial or product name within the selected status", () => {
    expect(filterSerials(rows, products, "biến", "warranty").map((row) => row.id)).toEqual(["1"]);
    expect(filterSerials(rows, products, "biến", "damaged")).toEqual([]);
  });

  it("searches by product SKU and warehouse name", () => {
    const rowsWithWarehouse = [
      { id: "1", serial: "BH-001", productId: "p1", status: "warranty", warehouseId: "wh-1" },
      { id: "2", serial: "HU-001", productId: "p2", status: "damaged", warehouseId: "wh-2" },
    ];
    const warehouses = [
      { id: "wh-1", name: "Kho Linh Kiện", code: "KLK" },
      { id: "wh-2", name: "Kho Thiết Bị", code: "KTB" },
    ];
    expect(filterSerials(rowsWithWarehouse, products, "SP-1", "", warehouses).map((r) => r.id)).toEqual(["1"]);
    expect(filterSerials(rowsWithWarehouse, products, "Linh Kiện", "", warehouses).map((r) => r.id)).toEqual(["1"]);
    expect(filterSerials(rowsWithWarehouse, products, "KTB", "", warehouses).map((r) => r.id)).toEqual(["2"]);
  });
});

describe("countDifference", () => {
  it("reports an increase or decrease from the recorded stock", () => {
    expect(countDifference(10, 13)).toBe(3);
    expect(countDifference(10, 7)).toBe(-3);
  });
});
