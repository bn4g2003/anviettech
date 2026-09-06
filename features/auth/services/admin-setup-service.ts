import argon2 from "argon2";
import { query, transaction } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { isCctvConfigured } from "@/lib/cctv-db";

export const SUPER_ADMIN_ROLE_ID = "00000000-0000-0000-0000-000000000001";
export const ADMIN_ROLE_ID = "00000000-0000-0000-0000-000000000002";
const SETUP_LOCK_KEY = 87231001;

const ADMIN_EXISTS_SQL = `
  SELECT EXISTS (
    SELECT 1
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.id
    WHERE u.deleted_at IS NULL
      AND ur.role_id IN ($1::uuid, $2::uuid)
  ) AS exists
`;

export async function hasAdminAccount() {
  const result = await query<{ exists: boolean }>(ADMIN_EXISTS_SQL, [SUPER_ADMIN_ROLE_ID, ADMIN_ROLE_ID]);
  return Boolean(result.rows[0]?.exists);
}

export async function getAdminSetupStatus() {
  return {
    available: !(await hasAdminAccount()),
    cctvConfigured: isCctvConfigured(),
  };
}

export async function bootstrapFirstAdmin(input: { fullName: string; email: string; password: string }) {
  return transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock($1)", [SETUP_LOCK_KEY]);

    const existing = await client.query<{ exists: boolean }>(ADMIN_EXISTS_SQL, [SUPER_ADMIN_ROLE_ID, ADMIN_ROLE_ID]);
    if (existing.rows[0]?.exists) {
      throw new ApiError(409, "Hệ thống đã có tài khoản quản trị. Không thể khởi tạo lại.");
    }

    const role = await client.query("SELECT id FROM roles WHERE id=$1", [SUPER_ADMIN_ROLE_ID]);
    if (!role.rowCount) {
      throw new ApiError(500, "Thiếu vai trò hệ thống Super admin. Khôi phục cấu hình phân quyền trước khi khởi tạo.");
    }

    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    let user;
    try {
      user = await client.query<{ id: string }>(
        `INSERT INTO users(full_name, email, password_hash, must_change_password)
         VALUES($1, $2, $3, false) RETURNING id`,
        [input.fullName, input.email, passwordHash],
      );
    } catch (error) {
      if ((error as { code?: string }).code === "23505") throw new ApiError(409, "Email đã tồn tại");
      throw error;
    }

    const userId = user.rows[0].id;
    await client.query("INSERT INTO user_roles(user_id, role_id) VALUES($1, $2)", [userId, SUPER_ADMIN_ROLE_ID]);
    await client.query(
      "INSERT INTO audit_logs(actor_id, module, action, entity_type, entity_id, after_data) VALUES($1,'users','bootstrap','user',$2,$3)",
      [userId, userId, JSON.stringify({ email: input.email, role: "Super admin" })],
    );
    return { id: userId };
  });
}
