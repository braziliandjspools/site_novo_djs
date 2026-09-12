"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { VipMusicCatalogItem, VipMusicFolder } from "../../lib/vip-music-catalog";
import type { VipMusicHomeSnapshot } from "../../lib/vip-music-home";
import { clearMusicasCache, fetchMusicasJson, peekMusicasCache } from "../lib/musicas-fetch-cache";
import { monthsReadKey } from "../lib/read-state";
import { useNewFolderHighlights } from "../lib/use-new-folder-highlights";
import { AtualizacoesSearch, AtualizacoesSearchResults } from "../atualizacoes/AtualizacoesSearch";
import { AtualizacoesSyncNotice } from "./AtualizacoesSyncNotice";
import { MusicasListSkeleton } from "./MusicasSkeletons";
import { MusicasMonthLinks } from "./MusicasMonthLinks";
import { UpdatesHero, UpdatesHeroSkeleton } from "./UpdatesHero";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasSession } from "./MusicasSessionContext";

type TreeResponse = { folders?: Array<VipMusicFolder | VipMusicCatalogItem>; error?: string };

const LAST_SYNC_KEY = "brs-atualizacoes-last-sync";

function readLastSync(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

function writeLastSync(iso: string) {
  try {
    sessionStorage.setItem(LAST_SYNC_KEY, iso);
  } catch {
    /* ignore */
  }
}

export function AtualizacoesRootClient() {
  const { hasVip } = useMusicasSession();
  const cachedTree = peekMusicasCache<TreeResponse>("/api/musicas/tree");
  const cachedHome = peekMusicasCache<VipMusicHomeSnapshot>("/api/musicas/home");
  const [folders, setFolders] = useState<Array<VipMusicFolder | VipMusicCatalogItem>>(
    cachedTree?.folders ?? [],
  );
  const [home, setHome] = useState<VipMusicHomeSnapshot | null>(cachedHome ?? null);
  const [loading, setLoading] = useState(!cachedTree?.folders?.length);
  const [homeLoading, setHomeLoading] = useState(!cachedHome);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(() => readLastSync());

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

  const loadHome = useCallback(async (forceRefresh = false) => {
    if (forceRefresh || !peekMusicasCache("/api/musicas/home")) setHomeLoading(true);
    try {
      const data = await fetchMusicasJson<VipMusicHomeSnapshot>(
        forceRefresh ? "/api/musicas/home?refresh=1" : "/api/musicas/home",
        { forceRefresh },
      );
      setHome(data);
      if (data.syncedAt && !readLastSync()) {
        setUpdatedAt(data.syncedAt);
      }
    } catch {
      /* home stats são opcionais para o hero */
    } finally {
      setHomeLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTree();
    void loadHome();
  }, [loadHome, loadTree]);

  const folderIds = folders.map((folder) => folder.id);
  const newFolderIds = useNewFolderHighlights(monthsReadKey(), folderIds);

  const folderCount = folders.length;

  const trackCount = useMemo(() => {
    const fromTree = folders.reduce((sum, folder) => {
      const count = (folder as VipMusicCatalogItem).trackCount;
      return sum + (typeof count === "number" && count > 0 ? count : 0);
    }, 0);
    if (fromTree > 0) return fromTree;
    if (home?.stats.trackCount && home.stats.trackCount > 0) return home.stats.trackCount;
    return null;
  }, [folders, home]);

  const showHeroSkeleton = loading && folders.length === 0 && !home;

  return (
    <div className="w-full">
      <AtualizacoesSearch />
      <AtualizacoesSearchResults />

      {showHeroSkeleton ? (
        <UpdatesHeroSkeleton />
      ) : (
        <UpdatesHero
          folderCount={folderCount}
          trackCount={trackCount}
          totalSizeLabel={null}
          updatedAt={updatedAt ?? home?.syncedAt ?? null}
          premium={hasVip}
          statsLoading={(loading || homeLoading) && trackCount == null}
          onSynced={async (result) => {
            if (result?.syncedAt) {
              writeLastSync(result.syncedAt);
              setUpdatedAt(result.syncedAt);
            }
            await Promise.all([loadTree(true), loadHome(true)]);
          }}
        />
      )}

      <AtualizacoesSyncNotice />

      {!hasVip && <VipUpgradeBanner />}

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div id="atualizacoes-pastas">
        {loading && folders.length === 0 ? (
          <MusicasListSkeleton rows={8} />
        ) : (
          <MusicasMonthLinks folders={folders} newFolderIds={newFolderIds} variant="hero" />
        )}
      </div>
    </div>
  );
}
