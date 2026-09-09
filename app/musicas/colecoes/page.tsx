"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CollectionAlbumGrid } from "../components/CollectionAlbumGrid";
import { CollectionHero } from "../components/CollectionHero";
import { CollectionsNavFooter } from "../components/CollectionsNavFooter";
import { MusicasListSkeleton } from "../components/MusicasSkeletons";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasSession } from "../components/MusicasSessionContext";

type CollectionListItem = {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  albumCount: number;
  trackCount: number;
  coverUrl?: string | null;
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

  const collectionCount = collections.length;

  return (
    <div className="w-full space-y-6">
      <nav className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <Link
          href="/musicas/atualizacoes"
          className="font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Atualizações
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-white">Coleções</span>
      </nav>

      <CollectionHero
        title="Coleções"
        eyebrow="Acervo VIP"
        description="Explore discografias, coleções especiais, décadas, remix services e séries completas."
        hasVip={hasVip}
        stats={
          loading
            ? [{ label: "Carregando…" }]
            : [
                {
                  label: `${collectionCount} ${collectionCount === 1 ? "coleção" : "coleções"}`,
                },
                { label: "Atualizações frequentes" },
                {
                  label: hasVip ? "Premium ativo" : "Prévia 1 min",
                  accent: hasVip,
                },
              ]
        }
      />

      {!hasVip && authenticated && <VipUpgradeBanner />}
      {!authenticated && <VipUpgradeBanner />}

      {loading ? (
        <MusicasListSkeleton rows={8} />
      ) : error ? (
        <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-8 text-center text-sm text-red-300">
          {error}
        </p>
      ) : !configured ? (
        <section className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-10 text-center">
          <p className="text-sm font-semibold text-amber-200">Pasta COLEÇÕES não encontrada</p>
          <p className="mx-auto mt-2 max-w-lg text-sm text-amber-100/80">
            No Google Drive do acervo VIP, crie a pasta <strong>COLEÇÕES</strong> com a estrutura:
            Coleção → Discos/pastas → arquivos. Coloque uma imagem <strong>folder.jpg</strong> (ou .png) na
            raiz de cada coleção para a capa. Ou defina{" "}
            <code className="rounded bg-black/30 px-1">GOOGLE_DRIVE_VIP_COLLECTIONS_FOLDER_ID</code> no
            ambiente.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">Coleções</h2>
          <CollectionAlbumGrid
            variant="catalog"
            items={collections.map((item) => ({
              id: item.id,
              displayName: item.displayName,
              slug: item.slug,
              albumCount: item.albumCount,
              trackCount: item.trackCount,
              hrefSegments: [item.slug],
              downloaderSlug: item.slug,
              coverUrl: item.coverUrl,
            }))}
            emptyLabel="Ainda não há coleções nesta pasta do Drive."
          />
        </section>
      )}

      <CollectionsNavFooter href="/musicas/atualizacoes" label="Voltar para Atualizações" />
    </div>
  );
}
