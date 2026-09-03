import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("inventory catalogue access migration", () => {
  it("grants warehouse users view-all access to customers and projects", () => {
    const sql = readFileSync(new URL("./007_inventory_catalog_access.sql", import.meta.url), "utf8");
    expect(sql).toMatch(/r\.name = 'Kho'/i);
    expect(sql).toMatch(/p\.module IN \('customers', 'projects'\)/i);
    expect(sql).toMatch(/p\.action = 'view'/i);
    expect(sql).toMatch(/p\.scope = 'all'/i);
  });
});
