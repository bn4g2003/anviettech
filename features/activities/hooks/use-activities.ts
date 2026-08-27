"use client";

import { useCallback, useEffect, useState } from "react";
import { activitiesService } from "@/features/activities/services/activities-service";
import type { Activity, ActivityInput } from "@/features/activities/types";

export function useActivities(filters?: { dealId?: string; enabled?: boolean }) {
  const [rows, setRows] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (filters?.enabled === false) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try { setRows(await activitiesService.list(filters)); }
    catch { setRows([]); }
    finally { setLoading(false); }
  }, [filters?.dealId, filters?.enabled]);

  useEffect(() => { void reload(); }, [reload]);

  return {
    rows,
    loading,
    reload,
    create: async (input: ActivityInput) => {
      const activity = await activitiesService.create(input);
      await reload();
      return activity;
    },
  };
}
