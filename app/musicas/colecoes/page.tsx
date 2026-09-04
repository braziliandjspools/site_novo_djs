"use client";

import { useEffect, useState } from "react";
import { Layers, Loader2, Music2 } from "lucide-react";
import { MusicasPageHeader } from "../MusicasShell";
import { CollectionAlbumGrid } from "../components/CollectionAlbumGrid";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasSession } from "../components/MusicasSessionContext";

type CollectionListItem = {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  albumCount: number;
  trackCount: number;
};

type ListResponse = {
  configured?: boolean;
  collections?: CollectionListItem[];
  message?: string;
  error?: string;
};

export default function ColecoesPage() {
  const { authenticated, hasVip } = useMusicasSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [collections, setCollections] = useState<CollectionListItem[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    void fetch("/api/musicas/colecoes", { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json()) as ListResponse;
        if (!res.ok) throw new Error(body.error ?? "Erro ao carregar coleções.");
        setConfigured(Boolean(body.configured));
        setCollections(body.collections ?? []);
      })
      .catch((err: Error) => {
        setError(err.message);
        setCollections([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalAlbums = collections.reduce((sum, item) => sum + item.albumCount, 0);
  const totalTracks = collections.reduce((sum, item) => sum + item.trackCount, 0);

  return (
    <div className="space-y-6">
      <MusicasPageHeader
        title="Coleções"
        subtitle="Discografias e coleções temáticas do acervo VIP."
      />

      {!hasVip && authenticated && <VipUpgradeBanner />}
      {!authenticated && <VipUpgradeBanner />}

      <div className="flex flex-wrap gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-[#181818] px-3 py-1.5 text-xs text-zinc-300">
          <Layers className="h-3.5 w-3.5 text-[#1ed760]" />
          {collections.length} coleções
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-[#181818] px-3 py-1.5 text-xs text-zinc-300">
          <Layers className="h-3.5 w-3.5 text-[#1ed760]" />
          {totalAlbums} álbuns
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-[#181818] px-3 py-1.5 text-xs text-zinc-300">
          <Music2 className="h-3.5 w-3.5 text-[#1ed760]" />
          {totalTracks} faixas
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1ed760]" />
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-8 text-center text-sm text-red-300">
          {error}
        </p>
      ) : !configured ? (
        <section className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-10 text-center">
          <p className="text-sm font-semibold text-amber-200">Pasta COLEÇÕES não encontrada</p>
          <p className="mx-auto mt-2 max-w-lg text-sm text-amber-100/80">
            No Google Drive do acervo VIP, crie a pasta <strong>COLEÇÕES</strong> com a estrutura:
            Coleção → Discos/pastas → arquivos. Ou defina{" "}
            <code className="rounded bg-black/30 px-1">GOOGLE_DRIVE_VIP_COLLECTIONS_FOLDER_ID</code> no
            ambiente.
          </p>
        </section>
      ) : (
        <CollectionAlbumGrid
          items={collections.map((item) => ({
            id: item.id,
            displayName: item.displayName,
            slug: item.slug,
            albumCount: item.albumCount,
            trackCount: item.trackCount,
            hrefSegments: [item.slug],
            downloaderSlug: item.slug,
          }))}
          emptyLabel="Ainda não há coleções nesta pasta do Drive."
        />
      )}
    </div>
  );
}
