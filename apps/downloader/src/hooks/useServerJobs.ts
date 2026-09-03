import { useCallback, useEffect, useState } from "react";
import type { DownloadJob } from "../lib/api/jobs";
import { listJobs } from "../lib/api/jobs";
import { loadSessionToken } from "../lib/native/secure-store";

export function useServerJobs(filters: {
  status?: string;
  limit?: number;
  pollMs?: number;
}) {
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const token = await loadSessionToken();
      if (!token) return;
      const response = await listJobs(token, {
        status: filters.status,
        limit: filters.limit ?? 100,
      });
      setJobs(response.jobs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar jobs.");
    } finally {
      setLoading(false);
    }
  }, [filters.limit, filters.status]);

  useEffect(() => {
    void refresh();
    if (!filters.pollMs) return;
    const timer = setInterval(() => {
      void refresh();
    }, filters.pollMs);
    return () => clearInterval(timer);
  }, [filters.pollMs, refresh]);

  return { jobs, loading, error, refresh };
}
