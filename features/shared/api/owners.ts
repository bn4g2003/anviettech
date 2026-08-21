"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { OwnerRef } from "@/features/shared/types/ids";

type ApiUser = { id: string; fullName: string; email: string; status: string };

let cache: OwnerRef[] | null = null;
let inflight: Promise<OwnerRef[]> | null = null;

export async function loadOwners(): Promise<OwnerRef[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = apiFetch<ApiUser[]>("/api/v1/users")
    .then((result) => {
      cache = (result.data ?? [])
        .filter((u) => u.status === "active")
        .map((u) => ({ id: u.id, name: u.fullName }));
      return cache;
    })
    .catch(() => {
      cache = [];
      return cache;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function invalidateOwners() {
  cache = null;
}

export function useOwners() {
  const [owners, setOwners] = useState<OwnerRef[]>(cache ?? []);
  useEffect(() => {
    void loadOwners().then(setOwners);
  }, []);
  return owners;
}

export function ownerByIdSync(id: string, owners: OwnerRef[]): OwnerRef {
  return owners.find((o) => o.id === id) ?? { id, name: "—" };
}

export async function resolveOwner(id?: string | null): Promise<OwnerRef> {
  if (!id) return { id: "", name: "—" };
  const owners = await loadOwners();
  return ownerByIdSync(id, owners);
}
