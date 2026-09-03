import { useCallback, useEffect, useRef, useState } from "react";
import type { DownloadJob } from "../lib/api/jobs";
import { listJobs } from "../lib/api/jobs";
import { useAuth } from "../context/AuthContext";
import { downloadManager } from "../lib/download/download-manager";

export function useServerJobs(filters: {
  status?: string;
  limit?: number;
  pollMs?: number;
}) {
  const { sessionToken, status } = useAuth();
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastManagerKey = useRef("");

  const refresh = useCallback(async () => {
    if (!sessionToken || status !== "authenticated") {
      setLoading(false);
      return;
    }
    try {
      const response = await listJobs(sessionToken, {
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
  }, [filters.limit, filters.status, sessionToken, status]);

  useEffect(() => {
    void refresh();
    if (!filters.pollMs || !sessionToken) return;
    const timer = setInterval(() => {
      void refresh();
    }, filters.pollMs);
    return () => clearInterval(timer);
  }, [filters.pollMs, refresh, sessionToken]);

  /** Atualiza quando a fila local muda de status/contagem (não a cada tick de progresso). */
  useEffect(() => {
    if (!sessionToken || status !== "authenticated") return;
    return downloadManager.subscribe((snapshot) => {
      const key = `${snapshot.pendingCount}|${snapshot.jobs.map((job) => `${job.id}:${job.status}`).join(",")}`;
      if (key === lastManagerKey.current) return;
      lastManagerKey.current = key;
      void refresh();
    });
  }, [refresh, sessionToken, status]);

  return { jobs, loading, error, refresh };
}
