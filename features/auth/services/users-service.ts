import argon2 from "argon2";
import { query, transaction } from "@/lib/db";
import { ApiError } from "@/lib/api";

const SUPER_ADMIN_ROLE_ID = "00000000-0000-0000-0000-000000000001";

export async function listUsers() {
  const result = await query<{
    id: string;
    fullName: string;
    email: string;
    status: string;
    mustChangePassword: boolean;
    lastLoginAt: string | null;
    roles: string[];
    roleIds: string[];
  }>(
    `SELECT u.id, u.full_name AS "fullName", u.email, u.status, u.must_change_password AS "mustChangePassword",
      u.last_login_at AS "lastLoginAt",
      COALESCE(array_agg(r.name) FILTER (WHERE r.id IS NOT NULL), '{}') roles,
      COALESCE(array_agg(r.id::text) FILTER (WHERE r.id IS NOT NULL), '{}') AS "roleIds"
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id=u.id
     LEFT JOIN roles r ON r.id=ur.role_id
     WHERE u.deleted_at IS NULL
     GROUP BY u.id
     ORDER BY u.created_at DESC`,
  );
  return result.rows;
}

export async function listActiveUsers() {
  const result = await query<{
    id: string;
    fullName: string;
    email: string;
    status: string;
    roles: string[];
  }>(
    `SELECT u.id, u.full_name AS "fullName", u.email, u.status,
      COALESCE(array_agg(r.name) FILTER (WHERE r.id IS NOT NULL), '{}') roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id=u.id
     LEFT JOIN roles r ON r.id=ur.role_id
     WHERE u.deleted_at IS NULL AND u.status = 'active'
     GROUP BY u.id
     ORDER BY u.full_name ASC`,
  );
  return result.rows;
}

export async function createUser(
  input: { fullName: string; email: string; temporaryPassword: string; roleIds: string[] },
  actorId: string,
) {
  if (!input.roleIds.length) throw new ApiError(422, "Chọn ít nhất một vai trò");
  return transaction(async (client) => {
    const roles = await client.query("SELECT id FROM roles WHERE id = ANY($1::uuid[])", [input.roleIds]);
    if (roles.rowCount !== input.roleIds.length) throw new ApiError(422, "Vai trò không hợp lệ");
    const passwordHash = await argon2.hash(input.temporaryPassword, { type: argon2.argon2id });
    let user;
    try {
      user = await client.query<{ id: string }>(
        "INSERT INTO users(full_name,email,password_hash,must_change_password) VALUES($1,$2,$3,true) RETURNING id",
        [input.fullName, input.email, passwordHash],
      );
    } catch (error) {
      if ((error as { code?: string }).code === "23505") throw new ApiError(409, "Email đã tồn tại");
      throw error;
    }
    for (const roleId of input.roleIds) {
      await client.query("INSERT INTO user_roles(user_id,role_id) VALUES($1,$2)", [user.rows[0].id, roleId]);
    }
    await client.query(
      "INSERT INTO audit_logs(actor_id,module,action,entity_type,entity_id,after_data) VALUES($1,'users','create','user',$2,$3)",
      [actorId, user.rows[0].id, JSON.stringify({ email: input.email, roleIds: input.roleIds })],
    );
    return user.rows[0];
  });
}

async function countActiveSuperAdmins(excludeUserId?: string) {
  const result = await query<{ n: string }>(
    `SELECT count(DISTINCT u.id)::text n FROM users u
     JOIN user_roles ur ON ur.user_id=u.id
     WHERE ur.role_id=$1 AND u.status='active' AND u.deleted_at IS NULL
       AND ($2::uuid IS NULL OR u.id <> $2)`,
    [SUPER_ADMIN_ROLE_ID, excludeUserId ?? null],
  );
  return Number(result.rows[0].n);
}

export async function updateUser(
  id: string,
  input: { fullName?: string; roleIds?: string[] },
  actorId: string,
) {
  return transaction(async (client) => {
    const current = await client.query<{ id: string }>("SELECT id FROM users WHERE id=$1 AND deleted_at IS NULL", [id]);
    if (!current.rows[0]) throw new ApiError(404, "Không tìm thấy tài khoản");

    if (input.roleIds) {
      const roles = await client.query("SELECT id FROM roles WHERE id = ANY($1::uuid[])", [input.roleIds]);
      if (roles.rowCount !== input.roleIds.length) throw new ApiError(422, "Vai trò không hợp lệ");

      const hadSuper = await client.query(
        "SELECT 1 FROM user_roles WHERE user_id=$1 AND role_id=$2",
        [id, SUPER_ADMIN_ROLE_ID],
      );
      const willHaveSuper = input.roleIds.includes(SUPER_ADMIN_ROLE_ID);
      if (hadSuper.rowCount && !willHaveSuper) {
        const remaining = await countActiveSuperAdmins(id);
        if (remaining < 1) throw new ApiError(409, "Không thể gỡ Super admin cuối cùng");
      }
      if (id === actorId && hadSuper.rowCount && !willHaveSuper) {
        throw new ApiError(409, "Không thể tự hạ quyền Super admin của chính mình");
      }

      await client.query("DELETE FROM user_roles WHERE user_id=$1", [id]);
      for (const roleId of input.roleIds) {
        await client.query("INSERT INTO user_roles(user_id,role_id) VALUES($1,$2)", [id, roleId]);
      }
    }

    if (input.fullName) {
      await client.query("UPDATE users SET full_name=$1, updated_at=now() WHERE id=$2", [input.fullName, id]);
    } else {
      await client.query("UPDATE users SET updated_at=now() WHERE id=$1", [id]);
    }

    await client.query(
      "INSERT INTO audit_logs(actor_id,module,action,entity_type,entity_id,after_data) VALUES($1,'users','update','user',$2,$3)",
      [actorId, id, JSON.stringify(input)],
    );
    return { id };
  });
}

export async function setUserStatus(id: string, status: "active" | "inactive", actorId: string) {
  if (id === actorId) throw new ApiError(409, "Không thể tự vô hiệu hóa tài khoản đang đăng nhập");

  return transaction(async (client) => {
    const current = await client.query<{ id: string }>("SELECT id FROM users WHERE id=$1 AND deleted_at IS NULL FOR UPDATE", [id]);
    if (!current.rows[0]) throw new ApiError(404, "Không tìm thấy tài khoản");

    if (status === "inactive") {
      const isSuper = await client.query(
        "SELECT 1 FROM user_roles WHERE user_id=$1 AND role_id=$2",
        [id, SUPER_ADMIN_ROLE_ID],
      );
      if (isSuper.rowCount) {
        const remaining = await countActiveSuperAdmins(id);
        if (remaining < 1) throw new ApiError(409, "Không thể vô hiệu hóa Super admin cuối cùng");
      }
    }

    await client.query("UPDATE users SET status=$1, updated_at=now() WHERE id=$2", [status, id]);
    if (status === "inactive") {
      await client.query("UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL", [id]);
    }
    await client.query(
      "INSERT INTO audit_logs(actor_id,module,action,entity_type,entity_id,after_data) VALUES($1,'users','status','user',$2,$3)",
      [actorId, id, JSON.stringify({ status })],
    );
  });
}
