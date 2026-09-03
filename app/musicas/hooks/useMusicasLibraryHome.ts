"use client";

import { useEffect, useState } from "react";
import type { VipMusicFolder } from "../../lib/vip-music-catalog";
import type { VipMusicHomeSnapshot } from "../../lib/vip-music-home";
import { monthsReadKey } from "../lib/read-state";
import { useNewFolderHighlights } from "../lib/use-new-folder-highlights";

export function useMusicasLibraryHome() {
  const [folders, setFolders] = useState<VipMusicFolder[]>([]);
  const [home, setHome] = useState<VipMusicHomeSnapshot | null>(null);
  const [loadingTree, setLoadingTree] = useState(true);
  const [loadingHome, setLoadingHome] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch("/api/musicas/tree", { cache: "no-store" })
        .then((res) => res.json())
        .then((treeData) => {
          setFolders((treeData as { folders?: VipMusicFolder[] }).folders ?? []);
          if ((treeData as { error?: string }).error) {
            setError((treeData as { error?: string }).error ?? null);
          }
        }),
      fetch("/api/musicas/home", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => setHome(data as VipMusicHomeSnapshot))
        .catch(() => setHome(null)),
    ])
      .catch(() => setError("Não foi possível carregar o acervo."))
      .finally(() => {
        setLoadingTree(false);
        setLoadingHome(false);
      });
  }, []);

  const folderIds = folders.map((folder) => folder.id);
  const newFolderIds = useNewFolderHighlights(monthsReadKey(), folderIds);

  return { folders, home, loadingTree, loadingHome, error, newFolderIds };
}
