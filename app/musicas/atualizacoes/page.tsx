"use client";

import { useCallback, useEffect, useState } from "react";
import type { VipMusicFolder } from "../../lib/vip-music-catalog";
import { AtualizacoesAcervoHero } from "../components/AtualizacoesAcervoHero";
import { AtualizacoesDriveSyncButton } from "../components/AtualizacoesDriveSyncButton";
import { AtualizacoesSyncNotice } from "../components/AtualizacoesSyncNotice";
import { MusicasMonthLinks } from "../components/MusicasMonthLinks";
import { MusicasListSkeleton } from "../components/MusicasSkeletons";
import { useMusicasSession } from "../components/MusicasSessionContext";
import { clearMusicasCache, fetchMusicasJson, peekMusicasCache } from "../lib/musicas-fetch-cache";
import { monthsReadKey } from "../lib/read-state";
import { useNewFolderHighlights } from "../lib/use-new-folder-highlights";

type TreeResponse = { folders?: VipMusicFolder[]; error?: string };

export default function AtualizacoesPage() {
  const { hasVip } = useMusicasSession();
  const cached = peekMusicasCache<TreeResponse>("/api/musicas/tree");
  const [folders, setFolders] = useState<VipMusicFolder[]>(cached?.folders ?? []);
  const [loading, setLoading] = useState(!cached?.folders?.length);
  const [error, setError] = useState<string | null>(null);

  const loadFolders = useCallback(async (forceRefresh = false) => {
    if (forceRefresh || !peekMusicasCache("/api/musicas/tree")) setLoading(true);
    setError(null);
    try {
      if (forceRefresh) clearMusicasCache("/api/musicas/");
      const url = forceRefresh ? "/api/musicas/tree?refresh=1" : "/api/musicas/tree";
      const data = await fetchMusicasJson<TreeResponse>(url, { forceRefresh });
      setFolders(data.folders ?? []);
      if (data.error) setError(data.error);
    } catch {
      setError("Não foi possível carregar os meses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);

  const newFolderIds = useNewFolderHighlights(
    monthsReadKey(),
    folders.map((folder) => folder.id),
  );

  return (
    <div className="w-full">
      <AtualizacoesAcervoHero
        monthCount={folders.length}
        hasVip={hasVip}
        badgeActions={<AtualizacoesDriveSyncButton onSynced={() => loadFolders(true)} />}
      />
      <AtualizacoesSyncNotice />

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading && folders.length === 0 ? (
        <MusicasListSkeleton rows={10} />
      ) : (
        <MusicasMonthLinks folders={folders} newFolderIds={newFolderIds} variant="hero" />
      )}
    </div>
  );
}
