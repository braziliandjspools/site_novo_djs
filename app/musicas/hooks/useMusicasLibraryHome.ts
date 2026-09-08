"use client";

import { useEffect, useState } from "react";
import type { VipMusicFolder } from "../../lib/vip-music-catalog";
import type { VipMusicHomeSnapshot } from "../../lib/vip-music-home";
import { fetchMusicasJson, peekMusicasCache } from "../lib/musicas-fetch-cache";
import { monthsReadKey } from "../lib/read-state";
import { useNewFolderHighlights } from "../lib/use-new-folder-highlights";

export function useMusicasLibraryHome() {
  const cachedTree = peekMusicasCache<{ folders?: VipMusicFolder[]; error?: string }>("/api/musicas/tree");
  const cachedHome = peekMusicasCache<VipMusicHomeSnapshot>("/api/musicas/home");
  const [folders, setFolders] = useState<VipMusicFolder[]>(cachedTree?.folders ?? []);
  const [home, setHome] = useState<VipMusicHomeSnapshot | null>(cachedHome);
  const [loadingTree, setLoadingTree] = useState(!cachedTree?.folders?.length);
  const [loadingHome, setLoadingHome] = useState(!cachedHome);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      fetchMusicasJson<{ folders?: VipMusicFolder[]; error?: string }>("/api/musicas/tree")
        .then((treeData) => {
          if (cancelled) return;
          setFolders(treeData.folders ?? []);
          if (treeData.error) setError(treeData.error);
        })
        .catch(() => {
          if (!cancelled && !cachedTree?.folders?.length) {
            setError("Não foi possível carregar o acervo.");
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingTree(false);
        }),
      fetchMusicasJson<VipMusicHomeSnapshot>("/api/musicas/home", { ttlMs: 120_000 })
        .then((data) => {
          if (!cancelled) setHome(data);
        })
        .catch(() => {
          if (!cancelled) setHome(null);
        })
        .finally(() => {
          if (!cancelled) setLoadingHome(false);
        }),
    ]);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once
  }, []);

  const folderIds = folders.map((folder) => folder.id);
  const newFolderIds = useNewFolderHighlights(monthsReadKey(), folderIds);

  return { folders, home, loadingTree, loadingHome, error, newFolderIds };
}
