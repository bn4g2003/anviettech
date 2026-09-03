import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("production migration safety", () => {
  it("does not seed demo financial transactions or guess existing product costs", () => {
    const sql = readFileSync(new URL("./migrations/002_analytics_financial_matrix.sql", import.meta.url), "utf8");
    expect(sql).not.toMatch(/INSERT\s+INTO\s+(orders|order_lines|invoices|operating_expenses)\b/i);
    expect(sql).not.toMatch(/UPDATE\s+products\s+SET\s+cost_price/i);
    expect(sql).not.toMatch(/random\s*\(/i);
  });

  it("does not retain a synthetic 65 percent cost fallback in financial analytics", () => {
    const source = readFileSync(new URL("../features/crm/services/domain-service.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/total\s*\*\s*0\.65/);
  });

  it("keeps demo scripts outside the automatically applied migration folder", () => {
    const files = readdirSync(new URL("./migrations/", import.meta.url));
    expect(files.filter((file) => /demo|seed/i.test(file))).toEqual([]);
  });

  it("adds inventory master data without changing existing product records", () => {
    const sql = readFileSync(new URL("./migrations/004_inventory_master_data.sql", import.meta.url), "utf8");
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS suppliers/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS projects/i);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS item_type/i);
    expect(sql).toMatch(/DEFAULT 'goods'/i);
    expect(sql).not.toMatch(/UPDATE\s+products/i);
    expect(sql).not.toMatch(/DELETE\s+FROM/i);
  });

  it("adds stock-move context additively without rewriting existing movements", () => {
    const sql = readFileSync(new URL("./migrations/005_stock_move_business_context.sql", import.meta.url), "utf8");
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS reason/i);
    expect(sql).toMatch(/supplier_id uuid REFERENCES suppliers/i);
    expect(sql).toMatch(/customer_id uuid REFERENCES customers/i);
    expect(sql).toMatch(/project_id uuid REFERENCES projects/i);
    expect(sql).not.toMatch(/UPDATE\s+stock_moves/i);
    expect(sql).not.toMatch(/DELETE\s+FROM/i);
  });

  it("keeps serials and stock counts as additive inventory-control records", () => {
    const sql = readFileSync(new URL("./migrations/006_inventory_control.sql", import.meta.url), "utf8");
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS serial_numbers/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS inventory_counts/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS inventory_count_lines/i);
    expect(sql).not.toMatch(/UPDATE\s+inventory_balances/i);
    expect(sql).not.toMatch(/DELETE\s+FROM/i);
  });
});
