import type { CurrentUser } from "./auth-types";
import { ApiError } from "../../../lib/api";

export type { CurrentUser };

export function permissionMatches(user: CurrentUser, module: string, action: string) {
  return user.permissions.filter(
    (permission) => (permission.module === "*" || permission.module === module) && permission.action === action,
  );
}

export function hasScopeAll(user: CurrentUser, module: string, action: string) {
  return permissionMatches(user, module, action).some((permission) => permission.scope === "all");
}

export function ensurePermission(user: CurrentUser, module: string, action: string, ownerId?: string | null) {
  const eligible = permissionMatches(user, module, action);
  if (
    eligible.some((permission) => permission.scope === "all") ||
    (ownerId === user.id && eligible.some((permission) => permission.scope === "own"))
  ) {
    return;
  }
  throw new ApiError(403, "Bạn không có quyền thực hiện thao tác này");
}
