"use client";

import { useEffect, useState } from "react";
import type { CurrentUser } from "@/features/auth/services/auth-types";
import { apiFetch } from "@/lib/api-client";

let cachedUser: CurrentUser | null = null;
let inflightUser: Promise<CurrentUser | null> | null = null;
const listeners = new Set<(user: CurrentUser | null) => void>();

export async function loadCurrentUser(force = false): Promise<CurrentUser | null> {
  if (cachedUser && !force) return cachedUser;
  if (inflightUser && !force) return inflightUser;
  inflightUser = apiFetch<CurrentUser>("/api/v1/auth/me")
    .then((result) => {
      cachedUser = result.data ?? null;
      listeners.forEach((l) => l(cachedUser));
      return cachedUser;
    })
    .catch(() => {
      cachedUser = null;
      return null;
    })
    .finally(() => {
      inflightUser = null;
    });
  return inflightUser;
}

export function setCurrentUserCache(user: CurrentUser | null) {
  cachedUser = user;
  listeners.forEach((l) => l(cachedUser));
}

export function useCurrentUser() {
  // The server and browser must begin with the same value during hydration.
  // Read the client-side cache only after the component has mounted.
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const listener = (u: CurrentUser | null) => setUser(u);
    listeners.add(listener);
    if (cachedUser) {
      setUser(cachedUser);
      setLoading(false);
    } else {
      void loadCurrentUser().finally(() => setLoading(false));
    }
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const isAdmin = Boolean(
    user?.roles.some((r) => r.toLowerCase().includes("admin")),
  );

  const canAssignOthers = (module: string, action = "create") => {
    if (!user) return false;
    if (isAdmin) return true;
    return user.permissions.some(
      (p) => (p.module === "*" || p.module === module) && p.action === action && p.scope === "all",
    );
  };

  const hasPermission = (module: string, action: string) => {
    if (!user) return false;
    if (isAdmin) return true;
    return user.permissions.some(
      (p) => (p.module === "*" || p.module === module) && p.action === action,
    );
  };

  const canView = (module: string) => hasPermission(module, "view");
  const canCreate = (module: string) => hasPermission(module, "create");
  const canApprove = (module: string) => hasPermission(module, "approve");

  const canEdit = (module: string, ownerId?: string) => {
    if (!user) return false;
    if (isAdmin) return true;
    const perms = user.permissions.filter(
      (p) => (p.module === "*" || p.module === module) && p.action === "update",
    );
    if (perms.some((p) => p.scope === "all")) return true;
    if (perms.some((p) => p.scope === "own")) {
      return !ownerId || ownerId === user.id;
    }
    return false;
  };

  const canDelete = (module: string, ownerId?: string) => {
    if (!user) return false;
    if (isAdmin) return true;
    const perms = user.permissions.filter(
      (p) => (p.module === "*" || p.module === module) && p.action === "delete",
    );
    if (perms.some((p) => p.scope === "all")) return true;
    if (perms.some((p) => p.scope === "own")) {
      return !ownerId || ownerId === user.id;
    }
    return false;
  };

  const primaryRole = user?.roles?.[0] || "Thành viên";

  return {
    user,
    loading,
    isAdmin,
    primaryRole,
    canAssignOthers,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canApprove,
  };
}
