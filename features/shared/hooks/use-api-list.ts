"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, toQuery, ApiClientError } from "@/lib/api-client";

export type ListState<T> = {
  rows: T[];
  total: number;
  loading: boolean;
  error: string | null;
  forbidden: boolean;
  reload: () => Promise<void>;
};

export function useApiList<T>(
  path: string,
  params: Record<string, string | number | undefined | null>,
  enabled = true,
): ListState<T> {
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const qs = toQuery(params);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const result = await apiFetch<T[]>(`${path}${qs}`);
      setRows(result.data ?? []);
      setTotal(result.meta?.total ?? result.data?.length ?? 0);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 403) {
        setForbidden(true);
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
      }
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [path, qs, enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { rows, total, loading, error, forbidden, reload };
}

export function useApiItem<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!path) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<T>(path);
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}
