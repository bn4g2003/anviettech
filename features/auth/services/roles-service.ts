import { query, transaction } from "@/lib/db";
import { ApiError } from "@/lib/api";

export async function listPermissions() {
  const result = await query<{ id: string; module: string; action: string; scope: string }>(
    "SELECT id, module, action, scope FROM permissions ORDER BY module, action, scope",
  );
  return result.rows;
}

export async function listRoles() {
  const result = await query<{
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    permissions: { id: string; module: string; action: string; scope: string }[];
  }>(
    `SELECT r.id, r.name, r.description, r.is_system AS "isSystem",
      COALESCE(jsonb_agg(jsonb_build_object('id', p.id, 'module', p.module, 'action', p.action, 'scope', p.scope))
        FILTER (WHERE p.id IS NOT NULL), '[]') permissions
     FROM roles r
     LEFT JOIN role_permissions rp ON rp.role_id=r.id
     LEFT JOIN permissions p ON p.id=rp.permission_id
     GROUP BY r.id
     ORDER BY r.name`,
  );
  return result.rows;
}

export async function getRole(id: string) {
  const result = await query<{
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    permissions: { id: string; module: string; action: string; scope: string }[];
  }>(
    `SELECT r.id, r.name, r.description, r.is_system AS "isSystem",
      COALESCE(jsonb_agg(jsonb_build_object('id', p.id, 'module', p.module, 'action', p.action, 'scope', p.scope)
        ORDER BY p.module, p.action, p.scope) FILTER (WHERE p.id IS NOT NULL), '[]') permissions
     FROM roles r
     LEFT JOIN role_permissions rp ON rp.role_id=r.id
     LEFT JOIN permissions p ON p.id=rp.permission_id
     WHERE r.id=$1
     GROUP BY r.id`,
    [id],
  );
  const role = result.rows[0];
  if (!role) throw new ApiError(404, "Không tìm thấy vai trò");
  return role;
}

export async function createRole(input: { name: string; description?: string; permissionIds: string[] }, actorId: string) {
  return transaction(async (client) => {
    let role;
    try {
      role = await client.query<{ id: string }>(
        "INSERT INTO roles(name, description) VALUES($1,$2) RETURNING id",
        [input.name, input.description ?? null],
      );
    } catch (error) {
      if ((error as { code?: string }).code === "23505") throw new ApiError(409, "Tên vai trò đã tồn tại");
      throw error;
    }
    for (const permissionId of input.permissionIds) {
      await client.query("INSERT INTO role_permissions(role_id, permission_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [
        role.rows[0].id,
        permissionId,
      ]);
    }
    await client.query(
      "INSERT INTO audit_logs(actor_id,module,action,entity_type,entity_id,after_data) VALUES($1,'roles','create','role',$2,$3)",
      [actorId, role.rows[0].id, JSON.stringify(input)],
    );
    return getRole(role.rows[0].id);
  });
}

export async function updateRole(
  id: string,
  input: { name?: string; description?: string; permissionIds?: string[] },
  actorId: string,
) {
  return transaction(async (client) => {
    const current = await client.query<{ id: string; is_system: boolean; name: string }>(
      "SELECT id, is_system, name FROM roles WHERE id=$1",
      [id],
    );
    if (!current.rows[0]) throw new ApiError(404, "Không tìm thấy vai trò");
    if (current.rows[0].is_system && input.name && input.name !== current.rows[0].name) {
      throw new ApiError(409, "Không thể đổi tên vai trò hệ thống");
    }
    await client.query(
      "UPDATE roles SET name=COALESCE($1,name), description=COALESCE($2,description), updated_at=now() WHERE id=$3",
      [input.name ?? null, input.description ?? null, id],
    );
    if (input.permissionIds) {
      await client.query("DELETE FROM role_permissions WHERE role_id=$1", [id]);
      for (const permissionId of input.permissionIds) {
        await client.query("INSERT INTO role_permissions(role_id, permission_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [
          id,
          permissionId,
        ]);
      }
    }
    await client.query(
      "INSERT INTO audit_logs(actor_id,module,action,entity_type,entity_id,after_data) VALUES($1,'roles','update','role',$2,$3)",
      [actorId, id, JSON.stringify(input)],
    );
    return getRole(id);
  });
}
