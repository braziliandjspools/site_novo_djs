"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { VipMusicFolder } from "../../lib/vip-music-catalog";
import { AtualizacoesAcervoHero } from "../components/AtualizacoesAcervoHero";
import { AtualizacoesSyncNotice } from "../components/AtualizacoesSyncNotice";
import { MusicasMonthLinks } from "../components/MusicasMonthLinks";
import { useMusicasSession } from "../components/MusicasSessionContext";
import { monthsReadKey } from "../lib/read-state";
import { useNewFolderHighlights } from "../lib/use-new-folder-highlights";

export default function AtualizacoesPage() {
  const { hasVip } = useMusicasSession();
  const [folders, setFolders] = useState<VipMusicFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFolders = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const refresh = forceRefresh ? "?refresh=1" : "";
      const res = await fetch(`/api/musicas/tree${refresh}`, { cache: "no-store" });
      const data = (await res.json()) as { folders?: VipMusicFolder[]; error?: string };
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
      <AtualizacoesAcervoHero monthCount={folders.length} hasVip={hasVip} />

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#1ed760]" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {!loading && !error && (
        <>
          <AtualizacoesSyncNotice onSynced={() => loadFolders(true)} />
          <MusicasMonthLinks folders={folders} newFolderIds={newFolderIds} variant="hero" />
        </>
      )}
    </div>
  );
}
