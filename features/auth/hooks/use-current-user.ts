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
  const [user, setUser] = useState<CurrentUser | null>(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);

  useEffect(() => {
    const listener = (u: CurrentUser | null) => setUser(u);
    listeners.add(listener);
    if (!cachedUser) {
      void loadCurrentUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const canAssignOthers = (module: string, action = "create") => {
    if (!user) return false;
    if (user.roles.some((r) => r.toLowerCase().includes("admin"))) return true;
    return user.permissions.some(
      (p) => (p.module === "*" || p.module === module) && p.action === action && p.scope === "all",
    );
  };

  const hasPermission = (module: string, action: string) => {
    if (!user) return false;
    if (user.roles.some((r) => r.toLowerCase().includes("admin"))) return true;
    return user.permissions.some(
      (p) => (p.module === "*" || p.module === module) && p.action === action,
    );
  };

  return { user, loading, canAssignOthers, hasPermission };
}
