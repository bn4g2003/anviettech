import argon2 from "argon2";
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { ApiError } from "@/lib/api";
import type { CurrentUser } from "./auth-types";
import { ensurePermission, hasScopeAll, permissionMatches } from "./permission-utils";

export type { CurrentUser };
export { ensurePermission, hasScopeAll, permissionMatches };

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "anviet_crm_session";
const SESSION_DAYS = 7;

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const result = await query<{
    id: string;
    full_name: string;
    email: string;
    must_change_password: boolean;
    roles: string[];
    permissions: { module: string; action: string; scope: "all" | "own" }[];
  }>(
    `SELECT u.id, u.full_name, u.email, u.must_change_password,
      COALESCE(array_agg(DISTINCT r.name) FILTER (WHERE r.id IS NOT NULL), '{}') roles,
      COALESCE(jsonb_agg(DISTINCT jsonb_build_object('module', p.module, 'action', p.action, 'scope', p.scope)) FILTER (WHERE p.id IS NOT NULL), '[]') permissions
    FROM sessions s JOIN users u ON u.id=s.user_id
    LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN roles r ON r.id=ur.role_id
    LEFT JOIN role_permissions rp ON rp.role_id=r.id LEFT JOIN permissions p ON p.id=rp.permission_id
    WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at > now() AND u.status='active' AND u.deleted_at IS NULL
    GROUP BY u.id`,
    [tokenHash(token)],
  );
  const row = result.rows[0];
  if (!row) return null;
  void query("UPDATE sessions SET last_seen_at=now() WHERE token_hash=$1", [tokenHash(token)]);
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    mustChangePassword: row.must_change_password,
    roles: row.roles,
    permissions: row.permissions,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Bạn cần đăng nhập");
  return user;
}

/** Business APIs — block until password changed */
export async function requireBusinessUser() {
  const user = await requireUser();
  if (user.mustChangePassword) throw new ApiError(403, "Bạn cần đổi mật khẩu trước khi tiếp tục");
  return user;
}

export async function requirePermission(module: string, action: string, ownerId?: string | null) {
  const user = await requireBusinessUser();
  ensurePermission(user, module, action, ownerId);
  return user;
}

/** Resolve create/assign owner: own → chỉ self; all → có thể gán user active khác. */
export async function resolveOwnerForCreate(
  user: CurrentUser,
  module: string,
  action: string,
  requestedOwnerId?: string | null,
) {
  const ownerId = requestedOwnerId ?? user.id;
  const eligible = permissionMatches(user, module, action);
  if (!eligible.length) throw new ApiError(403, "Bạn không có quyền thực hiện thao tác này");
  const canAll = eligible.some((permission) => permission.scope === "all");
  const canOwn = eligible.some((permission) => permission.scope === "own");
  if (!canAll && !(canOwn && ownerId === user.id)) {
    throw new ApiError(403, "Bạn không có quyền giao cho người dùng này");
  }
  const target = await query<{ id: string; status: string }>(
    "SELECT id, status FROM users WHERE id=$1 AND deleted_at IS NULL",
    [ownerId],
  );
  if (!target.rows[0]) throw new ApiError(422, "Người được giao không tồn tại");
  if (target.rows[0].status !== "active") throw new ApiError(422, "Người được giao không còn hoạt động");
  return ownerId;
}

export async function login(email: string, password: string, metadata: { ip?: string; userAgent?: string }) {
  const result = await query<{ id: string; password_hash: string; status: string }>(
    "SELECT id, password_hash, status FROM users WHERE lower(email)=lower($1) AND deleted_at IS NULL",
    [email],
  );
  const account = result.rows[0];
  const valid = !!account && account.status === "active" && (await argon2.verify(account.password_hash, password));
  await query("INSERT INTO login_audits(email, user_id, succeeded, ip, user_agent) VALUES($1,$2,$3,$4,$5)", [
    email,
    valid ? account.id : null,
    valid,
    metadata.ip ?? null,
    metadata.userAgent ?? null,
  ]);
  if (!valid) throw new ApiError(401, "Email hoặc mật khẩu không đúng");
  const token = randomBytes(32).toString("base64url");
  await query("INSERT INTO sessions(user_id, token_hash, expires_at) VALUES($1,$2,now() + interval '7 days')", [
    account.id,
    tokenHash(token),
  ]);
  await query("UPDATE users SET last_login_at=now() WHERE id=$1", [account.id]);
  return token;
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function logout() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await query("UPDATE sessions SET revoked_at=now() WHERE token_hash=$1", [tokenHash(token)]);
  store.delete(COOKIE_NAME);
}

export async function changePassword(userId: string, currentPassword: string, nextPassword: string) {
  const row = await query<{ password_hash: string }>("SELECT password_hash FROM users WHERE id=$1 AND deleted_at IS NULL", [userId]);
  if (!row.rows[0] || !(await argon2.verify(row.rows[0].password_hash, currentPassword))) {
    throw new ApiError(422, "Mật khẩu hiện tại không đúng");
  }
  const passwordHash = await argon2.hash(nextPassword, { type: argon2.argon2id });
  await query("UPDATE users SET password_hash=$1, must_change_password=false, updated_at=now() WHERE id=$2", [
    passwordHash,
    userId,
  ]);
}
