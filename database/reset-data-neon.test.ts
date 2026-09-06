import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sqlFile = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("reset_data_neon.sql validation against exportsql.sql", () => {
  const exportSql = sqlFile("./exportsql.sql");
  const resetSql = sqlFile("./reset_data_neon.sql");

  const retainedTables = ["roles", "permissions", "role_permissions", "users", "user_roles", "warehouses"];

  it("explicitly accounts for every single table found in exportsql.sql (39 tables)", () => {
    const exportTables = [...exportSql.matchAll(/CREATE TABLE "([^"]+)"/g)]
      .map((match) => match[1]);
    const uniqueExportTables = [...new Set(exportTables)].sort();

    expect(uniqueExportTables.length).toBe(39);

    const truncateMatch = resetSql.match(/TRUNCATE TABLE\s+([\s\S]*?)\s+RESTART IDENTITY/i)?.[1] ?? "";
    const resetTables = truncateMatch
      .split(",")
      .map((name) => name.trim().replace(/^public\./, ""))
      .filter(Boolean);

    expect(resetTables.length).toBe(33);

    // Verify all 39 tables are accounted for (33 truncated + 6 retained)
    const combinedAccountedTables = [...resetTables, ...retainedTables].sort();
    expect(combinedAccountedTables).toEqual(uniqueExportTables);
  });

  it("includes field_jobs in the TRUNCATE list to prevent foreign key errors on Neon", () => {
    expect(resetSql).toMatch(/public\.field_jobs/);
  });

  it("safely wraps everything in a single transaction with preflight check and lock timeout", () => {
    expect(resetSql).toMatch(/^\s*BEGIN;/m);
    expect(resetSql).toMatch(/COMMIT;\s*$/m);
    expect(resetSql).toMatch(/SET LOCAL search_path = public, pg_catalog;/);
    expect(resetSql).toMatch(/SET LOCAL lock_timeout = '10s';/);
    expect(resetSql).toMatch(/Thiếu vai trò hệ thống Super admin/);
  });

  it("protects all admin accounts and retains current password hashes", () => {
    expect(resetSql).toMatch(/temp_kept_admins/);
    expect(resetSql).toMatch(/ur\.role_id IN \(super_admin_role_id, admin_role_id\)/);
    expect(resetSql).toMatch(/00000000-0000-0000-0000-000000000010/);
    expect(resetSql).toMatch(/admin@anviet\.local/);
    // Ensures only non-admins are removed
    expect(resetSql).toMatch(/DELETE FROM public\.user_roles\s+WHERE user_id NOT IN \(SELECT user_id FROM temp_kept_admins\);/);
    expect(resetSql).toMatch(/DELETE FROM public\.users\s+WHERE id NOT IN \(SELECT user_id FROM temp_kept_admins\);/);
  });

  it("preserves warehouses and standardizes KHO-001 as sole default", () => {
    expect(resetSql).toMatch(/INSERT INTO public\.warehouses \(code, name, is_default\)/);
    expect(resetSql).toMatch(/VALUES \('KHO-001', 'Kho trung tâm', true\)/);
    expect(resetSql).toMatch(/ON CONFLICT \(code\) DO UPDATE/);
  });
});
