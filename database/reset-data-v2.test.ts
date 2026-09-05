import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import argon2 from "argon2";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const sqlFile = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const reset = sqlFile("./reset_data_v2.sql");
const schema = sqlFile("./init/001_schema.sql");
const seed = sqlFile("./init/002_seed.sql");
const migrations = readdirSync(new URL("./migrations/", import.meta.url))
  .filter((file) => file.endsWith(".sql")).sort()
  .map((file) => sqlFile(`./migrations/${file}`)).join("\n");
const adminId = "00000000-0000-0000-0000-000000000010";
const superRoleId = "00000000-0000-0000-0000-000000000001";
const retainedTables = ["roles", "permissions", "role_permissions", "users", "user_roles", "warehouses"];

it("explicitly accounts for every table in the schema and all migrations", () => {
  const tables = [...(schema + migrations).matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/gi)]
    .map((match) => match[1]);
  const truncate = reset.match(/TRUNCATE TABLE\s+([\s\S]*?)\s+RESTART IDENTITY/i)?.[1] ?? "";
  const resetTables = truncate.split(",").map((name) => name.trim().replace(/^public\./, ""));
  expect([...resetTables, ...retainedTables].sort()).toEqual([...new Set(tables)].sort());
});

// Opt-in: uses ONLY the local compose postgres service, never DATABASE_URL.
// Each test creates and drops its own empty database with a generated name.
describe.runIf(process.env.RUN_RESET_DB_TESTS === "1")("reset v2 on PostgreSQL", () => {
  let databaseName = "";
  let created = false;

  function psql(database: string, sql: string) {
    return execFileSync("docker", [
      "compose", "exec", "-T", "postgres", "psql", "-X", "-qAt",
      "-U", process.env.RESET_TEST_POSTGRES_USER ?? "anviet", "-d", database,
      "-v", "ON_ERROR_STOP=1",
    ], { input: sql, encoding: "utf8", timeout: 30_000, stdio: ["pipe", "pipe", "pipe"] }).trim();
  }

  function query(sql: string) {
    if (!created || !/^anviet_reset_test_[a-f0-9]{32}$/.test(databaseName)) {
      throw new Error("Refusing to query a database not created by this test");
    }
    return psql(databaseName, sql);
  }

  function loadFixture(seedSql = seed) {
    query(schema + "\n" + seedSql + "\n" + migrations);
  }

  function snapshot() {
    return JSON.parse(query(`
      SELECT json_build_object(
        'users', (SELECT json_agg(u ORDER BY id) FROM users u),
        'customers', (SELECT json_agg(c ORDER BY id) FROM customers c),
        'products', (SELECT json_agg(p ORDER BY id) FROM products p),
        'warehouses', (SELECT json_agg(w ORDER BY id) FROM warehouses w)
      );
    `));
  }

  function permissionsSnapshot() {
    return query(`SELECT json_build_object(
      'roles', (SELECT json_agg(r ORDER BY id) FROM roles r),
      'permissions', (SELECT json_agg(p ORDER BY id) FROM permissions p),
      'role_permissions', (SELECT json_agg(rp ORDER BY role_id, permission_id) FROM role_permissions rp)
    );`);
  }

  beforeEach(() => {
    databaseName = `anviet_reset_test_${randomUUID().replaceAll("-", "")}`;
    created = false;
    psql("postgres", `CREATE DATABASE "${databaseName}";`);
    created = true;
  }, 30_000);

  afterEach(() => {
    if (created && /^anviet_reset_test_[a-f0-9]{32}$/.test(databaseName)) {
      psql("postgres", `DROP DATABASE "${databaseName}";`);
      created = false;
    }
  }, 30_000);

  it("clears all 32 business tables, preserves configured permissions and supports reruns", async () => {
    loadFixture();
    const currentHash = await argon2.hash(randomUUID());
    query(`UPDATE users SET password_hash='${currentHash}', must_change_password=false;
      INSERT INTO roles(name) VALUES ('Custom reset test role');`);
    query(sqlFile("./fixtures/reset-data-v2.sql"));
    const before = permissionsSnapshot();
    const businessTables: string[] = JSON.parse(query(`
      SELECT json_agg(tablename ORDER BY tablename) FROM pg_tables
      WHERE schemaname='public' AND tablename NOT IN (${retainedTables.map((t) => `'${t}'`).join(",")});
    `));
    const counts = businessTables.map((table) => `SELECT count(*) FROM public."${table}";`).join("\n");
    expect(query(counts).split("\n").every((count) => Number(count) > 0)).toBe(true);

    query(reset);
    expect(query(counts).split("\n").every((count) => count === "0")).toBe(true);
    expect(permissionsSnapshot()).toBe(before);
    expect(query("SELECT count(*) FROM users;")).toBe("1");
    expect(query("SELECT password_hash FROM users;")).toBe(currentHash);
    expect(query("SELECT must_change_password FROM users;")).toBe("f");
    expect(query(`SELECT count(*) FROM user_roles WHERE user_id='${adminId}' AND role_id='${superRoleId}';`)).toBe("1");
    query(reset);
    expect(query("SELECT count(*) FROM users;")).toBe("1");
    expect(query("SELECT count(*) FROM warehouses WHERE is_default AND deleted_at IS NULL;")).toBe("1");
    expect(permissionsSnapshot()).toBe(before);
  }, 60_000);

  it("restores a soft-deleted admin and warehouse without changing credentials or warehouse metadata", () => {
    loadFixture();
    query(`UPDATE users SET status='inactive', deleted_at=now();
      DELETE FROM user_roles;
      UPDATE warehouses SET name='Custom warehouse', address='Test address', deleted_at=now();
      INSERT INTO warehouses(code, name, is_default) VALUES ('KHO-EXTRA', 'Another warehouse', true);`);
    const password = query("SELECT password_hash FROM users;");
    query(reset);
    expect(query("SELECT status, deleted_at IS NULL, must_change_password FROM users;")).toBe("active|t|t");
    expect(query("SELECT password_hash FROM users;")).toBe(password);
    expect(query(`SELECT role_id FROM user_roles WHERE user_id='${adminId}';`)).toBe(superRoleId);
    expect(query("SELECT name, address, is_default, deleted_at IS NULL FROM warehouses WHERE code='KHO-001';"))
      .toBe("Custom warehouse|Test address|t|t");
    expect(query("SELECT count(*) FROM warehouses;")).toBe("2");
    expect(query("SELECT count(*) FROM warehouses WHERE is_default;")).toBe("1");
  }, 60_000);

  it("keeps the seeded admin identity and current password after their email changes", () => {
    loadFixture();
    query("UPDATE users SET email='renamed-admin@example.test', full_name='Current admin';");
    const password = query("SELECT password_hash FROM users;");
    query(reset);
    expect(query("SELECT id, email, full_name FROM users;"))
      .toBe(`${adminId}|renamed-admin@example.test|Current admin`);
    expect(query("SELECT password_hash FROM users;")).toBe(password);
  }, 60_000);

  it("finds an admin by email when their UUID differs from the original seed", () => {
    const alternateId = "90000000-0000-0000-0000-000000000010";
    loadFixture(seed.replaceAll(adminId, alternateId));
    query(reset);
    expect(query("SELECT id FROM users;")).toBe(alternateId);
    expect(query(`SELECT role_id FROM user_roles WHERE user_id='${alternateId}';`)).toBe(superRoleId);
  }, 60_000);

  it("creates a missing admin with a verified temporary password and requires a password change", async () => {
    loadFixture();
    query(reset);
    query("DELETE FROM user_roles; DELETE FROM users; DELETE FROM warehouses;");
    query(reset);
    expect(query("SELECT id, status, must_change_password, deleted_at IS NULL FROM users;"))
      .toBe(`${adminId}|active|t|t`);
    expect(await argon2.verify(query("SELECT password_hash FROM users;"), "Admin@123")).toBe(true);
    expect(query("SELECT code, is_default FROM warehouses;")).toBe("KHO-001|t");
  }, 60_000);

  it("aborts without data loss when the system Super admin role is missing", () => {
    loadFixture();
    query(`DELETE FROM user_roles WHERE role_id='${superRoleId}';
      DELETE FROM role_permissions WHERE role_id='${superRoleId}';
      DELETE FROM roles WHERE id='${superRoleId}';`);
    const before = snapshot();
    expect(() => query(reset)).toThrow(/Super admin/);
    expect(snapshot()).toEqual(before);
  }, 60_000);

  it("aborts without data loss if a required migration table is missing", () => {
    loadFixture();
    query("DROP TABLE revenue_reductions;");
    const before = snapshot();
    expect(() => query(reset)).toThrow(/revenue_reductions/);
    expect(snapshot()).toEqual(before);
  }, 60_000);

  it("refuses to cascade into an unlisted table", () => {
    loadFixture();
    query(`CREATE TABLE external_customer_links(customer_id uuid REFERENCES customers(id));
      INSERT INTO external_customer_links SELECT id FROM customers;`);
    const before = snapshot();
    expect(() => query(reset)).toThrow(/foreign key constraint/);
    expect(snapshot()).toEqual(before);
    expect(query("SELECT count(*) FROM external_customer_links;")).toBe("1");
  }, 60_000);

  it("rolls back earlier deletions when a later warehouse update fails", () => {
    loadFixture();
    query(`CREATE FUNCTION reject_reset_warehouse() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'reset warehouse test failure'; END $$;
      CREATE TRIGGER reject_reset BEFORE UPDATE ON warehouses
      FOR EACH ROW EXECUTE FUNCTION reject_reset_warehouse();`);
    const before = snapshot();
    expect(() => query(reset)).toThrow(/reset warehouse test failure/);
    expect(snapshot()).toEqual(before);
  }, 60_000);
});
