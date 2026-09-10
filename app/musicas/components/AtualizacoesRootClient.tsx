"use client";

import { useCallback, useEffect, useState } from "react";
import type { VipMusicFolder } from "../../lib/vip-music-catalog";
import { clearMusicasCache, fetchMusicasJson, peekMusicasCache } from "../lib/musicas-fetch-cache";
import { monthsReadKey } from "../lib/read-state";
import { useNewFolderHighlights } from "../lib/use-new-folder-highlights";
import { AtualizacoesDriveSyncButton } from "./AtualizacoesDriveSyncButton";
import { AtualizacoesSyncNotice } from "./AtualizacoesSyncNotice";
import { MusicasListSkeleton } from "./MusicasSkeletons";
import { MusicasMonthLinks } from "./MusicasMonthLinks";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasSession } from "./MusicasSessionContext";

type TreeResponse = { folders?: VipMusicFolder[]; error?: string };

export function AtualizacoesRootClient() {
  const { hasVip } = useMusicasSession();
  const cachedTree = peekMusicasCache<TreeResponse>("/api/musicas/tree");
  const [folders, setFolders] = useState<VipMusicFolder[]>(cachedTree?.folders ?? []);
  const [loading, setLoading] = useState(!cachedTree?.folders?.length);
  const [error, setError] = useState<string | null>(null);

  const loadTree = useCallback(async (forceRefresh = false) => {
    if (forceRefresh || !peekMusicasCache("/api/musicas/tree")) setLoading(true);
    setError(null);
    try {
      if (forceRefresh) clearMusicasCache("/api/musicas/");
      const data = await fetchMusicasJson<TreeResponse>(
        forceRefresh ? "/api/musicas/tree?refresh=1" : "/api/musicas/tree",
        { forceRefresh },
      );
      setFolders(data.folders ?? []);
      if (data.error) setError(data.error);
    } catch {
      setError("Não foi possível carregar as pastas do Drive.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTree();
  }, [loadTree]);

  const folderIds = folders.map((folder) => folder.id);
  const newFolderIds = useNewFolderHighlights(monthsReadKey(), folderIds);

  return (
    <div className="w-full">
      <AtualizacoesSyncNotice />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1ed760]">
            Atualizações
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">Pastas do Drive</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Abra uma pasta para ver subpastas e faixas — cada nível em uma página nova.
          </p>
        </div>
        <AtualizacoesDriveSyncButton
          onSynced={async () => {
            await loadTree(true);
          }}
        />
      </div>

      {!hasVip && <VipUpgradeBanner />}

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading && folders.length === 0 ? (
        <MusicasListSkeleton rows={8} />
      ) : (
        <MusicasMonthLinks folders={folders} newFolderIds={newFolderIds} variant="hero" />
      )}
    </div>
  );
}
