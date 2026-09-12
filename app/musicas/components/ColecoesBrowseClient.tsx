"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Copy,
  Loader2,
  MonitorDown,
  Pause,
  Play,
  Share2,
} from "lucide-react";
import { collectionsHref } from "../../lib/vip-music-slugs";
import { withForcedFolderTree } from "../../lib/force-folder-tree";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { pushRecentFolder } from "../lib/music-library-storage";
import { sendPackSlugToDownloader } from "../lib/send-to-downloader";
import { useMusicasSession } from "./MusicasSessionContext";
import { AtualizacoesMonthFooterNav } from "./AtualizacoesMonthFooterNav";
import { CollectionAlbumGrid } from "./CollectionAlbumGrid";
import { CollectionContextMenu, type CollectionMenuAction } from "./CollectionContextMenu";
import { CollectionHero } from "./CollectionHero";
import { CollectionTracksPanel } from "./CollectionTracksPanel";
import { CollectionVolumesView } from "./CollectionVolumesView";
import { CollectionsNavFooter } from "./CollectionsNavFooter";
import { SendPackToDownloaderButton } from "./SendPackToDownloaderButton";
import { useDownloaderSync } from "./DownloaderSyncContext";
import { useMusicasToast } from "./MusicasToast";
import { useVipMusicPlayer } from "./VipMusicPlayerContext";
import { fetchMusicasJson, peekMusicasCache, setMusicasCache } from "../lib/musicas-fetch-cache";
import type { PreviewTrack } from "../../lib/google-drive";

type CollectionChildItem = {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  folderCount: number;
  trackCount: number;
  level: "folders" | "tracks";
  coverUrl?: string | null;
};

type ResolveResponse = {
  configured: boolean;
  folderId: string;
  folderName: string;
  displayName: string;
  level: "folders" | "tracks";
  slugSegments: string[];
  resolvedPath: { slug: string; id: string; name: string; displayName: string }[];
  items: CollectionChildItem[];
  tracks?: PreviewTrack[];
  albumCount: number;
  trackCount: number;
  coverUrl?: string | null;
  canPlay?: boolean;
  canDownload?: boolean;
  message?: string;
  error?: string;
};

type ColecoesBrowseClientProps = {
  slugSegments: string[];
};

type TracksResponse = {
  tracks: PreviewTrack[];
  total?: number;
  page?: number;
  hasMore?: boolean;
  error?: string;
};

export function ColecoesBrowseClient({ slugSegments }: ColecoesBrowseClientProps) {
  const router = useRouter();
  const { authenticated, hasVip, openLogin } = useMusicasSession();
  const sync = useDownloaderSync();
  const { showToast } = useMusicasToast();
  const { playingFolderId, playingId, isPlaying, toggleTrack, pause } = useVipMusicPlayer();
  const [data, setData] = useState<ResolveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siblings, setSiblings] = useState<{ slug: string; displayName: string }[]>([]);
  const [playBusy, setPlayBusy] = useState(false);

  const slugPath = slugSegments.join("/");
  const resolveKey = `/api/musicas/colecoes/resolve?slug=${encodeURIComponent(slugPath)}`;

  useEffect(() => {
    const cached = peekMusicasCache<ResolveResponse>(resolveKey);
    if (cached) {
      setData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);

    let cancelled = false;
    void fetchMusicasJson<ResolveResponse>(resolveKey)
      .then((body) => {
        if (cancelled) return;
        setMusicasCache(resolveKey, body);
        setData(body);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        if (!cached) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slugPath, resolveKey]);

  useEffect(() => {
    const parentPath = slugSegments.slice(0, -1).join("/");
    const url =
      slugSegments.length <= 1
        ? "/api/musicas/colecoes"
        : `/api/musicas/colecoes/resolve?slug=${encodeURIComponent(parentPath)}`;

    let cancelled = false;
    void fetchMusicasJson<{
      collections?: { slug: string; displayName: string }[];
      items?: { slug: string; displayName: string }[];
    }>(url)
      .then((body) => {
        if (cancelled) return;
        if (body.collections) {
          setSiblings(body.collections.map((item) => ({ slug: item.slug, displayName: item.displayName })));
        } else if (body.items) {
          setSiblings(body.items.map((item) => ({ slug: item.slug, displayName: item.displayName })));
        } else {
          setSiblings([]);
        }
      })
      .catch(() => {
        if (!cancelled) setSiblings([]);
      });

    return () => {
      cancelled = true;
    };
  }, [slugPath, slugSegments]);

  useEffect(() => {
    if (!data) return;
    pushRecentFolder({
      name: data.displayName,
      href: collectionsHref(slugSegments),
    });
  }, [data, slugSegments]);

  const parentSegments = slugSegments.slice(0, -1);
  const parentPathKey = parentSegments.join("/");
  const homeHref = parentPathKey
    ? collectionsHref(parentPathKey.split("/"))
    : "/musicas/colecoes";
  const currentSlug = slugSegments.at(-1) ?? "";
  const siblingNavItems = useMemo(
    () =>
      siblings.map((item) => {
        const parents = parentPathKey ? parentPathKey.split("/") : [];
        return {
          slug: item.slug,
          label: item.displayName,
          href: collectionsHref([...parents, item.slug]),
        };
      }),
    [siblings, parentPathKey],
  );

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1ed760]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-8 text-center text-sm text-red-300">
        {error ?? "Não foi possível abrir esta coleção."}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-[#1ed760] px-4 py-2 text-xs font-bold text-black"
          >
            Recarregar
          </button>
          <Link href="/musicas/colecoes" className="text-[#1ed760] hover:underline">
            Voltar para Coleções
          </Link>
        </div>
      </div>
    );
  }

  const canPlay = Boolean(data.canPlay);
  const canDownload = Boolean(data.canDownload);
  const packSlug = slugSegments.join("/");
  const relativePath = withForcedFolderTree(
    data.resolvedPath.map((part) => part.displayName).join("/"),
  );
  const showVolumes =
    data.level === "folders" && data.items.every((item) => item.level === "tracks");
  const isAlbumPage = data.level === "tracks";
  const pagePlaying = playingFolderId === data.folderId && isPlaying && Boolean(playingId);
  const folderId = data.folderId;
  const folderName = data.folderName;
  const displayName = data.displayName;
  const firstChildSlug = data.items[0]?.slug;
  const albumCount = data.albumCount;
  const trackCount = data.trackCount;
  const childItems = data.items;
  const resolvedPath = data.resolvedPath;
  const coverUrl = data.coverUrl;

  async function handlePlay() {
    if (!canPlay || playBusy) return;
    if (pagePlaying) {
      pause();
      return;
    }

    if (!isAlbumPage) {
      if (firstChildSlug) {
        router.push(collectionsHref([...slugSegments, firstChildSlug]));
      }
      return;
    }

    setPlayBusy(true);
    try {
      const params = new URLSearchParams({
        folderId,
        folderName,
        page: "1",
        limit: "1",
      });
      const res = await fetch(`/api/musicas/tracks?${params.toString()}`, { cache: "no-store" });
      const body = (await res.json()) as TracksResponse;
      if (!res.ok) throw new Error(body.error ?? "Não foi possível iniciar a reprodução.");
      const first = body.tracks[0];
      if (!first) {
        showToast("Nenhuma faixa neste álbum.", "error");
        return;
      }
      await toggleTrack(folderId, first.id);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao tocar.", "error");
    } finally {
      setPlayBusy(false);
    }
  }

  async function sendWholePack() {
    if (!authenticated) {
      openLogin();
      return;
    }
    if (!hasVip) {
      showToast("Plano VIP necessário para usar o Downloader.", "error");
      return;
    }
    try {
      showToast("Enviando…");
      const result = await sendPackSlugToDownloader(packSlug, {
        target: sync?.selectedTarget,
        devices: sync?.devices,
        root: "colecoes",
      });
      showToast(
        result.count === 1
          ? "Adicionado à fila do Downloader"
          : `${result.count} faixas adicionadas à fila`,
      );
      await sync?.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao enviar ao Downloader.", "error");
    }
  }

  function currentPageUrl() {
    return `${window.location.origin}${collectionsHref(slugSegments)}`;
  }

  const menuActions: CollectionMenuAction[] = [
    {
      id: "downloader",
      label: isAlbumPage ? "Enviar álbum ao Downloader" : "Baixar coleção inteira",
      icon: MonitorDown,
      onClick: () => void sendWholePack(),
    },
    {
      id: "copy",
      label: "Copiar link",
      icon: Copy,
      onClick: () => {
        void navigator.clipboard
          .writeText(currentPageUrl())
          .then(() => showToast("Link copiado"))
          .catch(() => showToast("Não foi possível copiar o link.", "error"));
      },
    },
    {
      id: "share",
      label: "Compartilhar",
      icon: Share2,
      onClick: () => {
        void (async () => {
          const pageUrl = currentPageUrl();
          try {
            if (navigator.share) {
              await navigator.share({ title: displayName, url: pageUrl });
            } else {
              await navigator.clipboard.writeText(pageUrl);
              showToast("Link copiado para compartilhar");
            }
          } catch (err) {
            if (err instanceof Error && err.name === "AbortError") return;
            showToast("Não foi possível compartilhar.", "error");
          }
        })();
      },
    },
  ];

  const heroStats = [
    ...(data.level === "folders"
      ? [
          {
            label: `${albumCount} ${albumCount === 1 ? "álbum" : "álbuns"}`,
          },
        ]
      : []),
    {
      label: `${trackCount} ${trackCount === 1 ? "faixa" : "faixas"}`,
    },
    {
      label: hasVip ? "Premium ativo" : "Só navegação",
      accent: hasVip,
    },
  ];

  return (
    <div className="w-full space-y-6">
      <nav className="mb-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <Link
          href="/musicas/atualizacoes"
          className="font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Atualizações
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href="/musicas/colecoes"
          className="font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Coleções
        </Link>
        {resolvedPath.map((part, index) => {
          const href = collectionsHref(slugSegments.slice(0, index + 1));
          const isLast = index === resolvedPath.length - 1;
          return (
            <span key={part.id} className="contents">
              <ChevronRight className="h-3 w-3" />
              {isLast ? (
                <span className="font-medium text-white">{part.displayName}</span>
              ) : (
                <Link href={href} className="font-medium text-zinc-400 transition-colors hover:text-white">
                  {part.displayName}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      <CollectionHero
        title={displayName}
        eyebrow={isAlbumPage ? "Álbum" : "Coleção"}
        description={
          isAlbumPage
            ? "Ouça as faixas e envie o álbum ao BRS Downloader."
            : "Discografia completa — abra um álbum ou envie a coletânea ao Downloader."
        }
        coverUrl={coverUrl}
        hasVip={hasVip}
        stats={heroStats}
        actions={
          <>
            <button
              type="button"
              onClick={() => void handlePlay()}
              disabled={!canPlay || playBusy || (!isAlbumPage && childItems.length === 0)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#1ed760] px-5 text-sm font-bold text-black transition hover:scale-[1.02] hover:bg-[#2dff7a] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {playBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : pagePlaying ? (
                <Pause className="h-4 w-4" fill="currentColor" />
              ) : (
                <Play className="h-4 w-4" fill="currentColor" />
              )}
              <span className="hidden sm:inline">{pagePlaying ? "Pausar" : "Ouvir"}</span>
            </button>

            {canDownload ? (
              <SendPackToDownloaderButton
                slug={packSlug}
                root="colecoes"
                label={isAlbumPage ? "Enviar ao Downloader" : "Enviar coleção"}
                className="!h-11 !px-4"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!authenticated) openLogin();
                  else showToast("Plano VIP necessário para usar o Downloader.", "error");
                }}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-zinc-600 px-4 text-sm font-semibold text-zinc-300"
              >
                <MonitorDown className="h-4 w-4" />
                <span className="hidden sm:inline">Downloader</span>
              </button>
            )}

            <CollectionContextMenu label="Mais opções" actions={menuActions} />
          </>
        }
      />

      {!hasVip && authenticated && <VipUpgradeBanner />}
      {!authenticated && <VipUpgradeBanner />}

      {showVolumes ? (
        <CollectionVolumesView
          volumes={childItems.map((item) => ({
            id: item.id,
            name: item.name,
            displayName: item.displayName,
            slug: item.slug,
            trackCount: item.trackCount,
            coverUrl: item.coverUrl,
            downloaderSlug: [...slugSegments, item.slug].join("/"),
            relativePath: withForcedFolderTree(
              [...resolvedPath.map((part) => part.displayName), item.displayName].join("/"),
            ),
            hrefSegments: [...slugSegments, item.slug],
          }))}
          canPlay={canPlay}
          canDownload={canDownload}
        />
      ) : isAlbumPage ? (
        <CollectionTracksPanel
          folderId={folderId}
          folderName={folderName}
          canPlay={canPlay}
          canDownload={canDownload}
          relativePath={relativePath}
          coverUrl={coverUrl}
          initialTracks={data?.tracks?.length ? data.tracks : undefined}
          initialTotal={data?.trackCount}
        />
      ) : (
        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">Pastas</h2>
          <CollectionAlbumGrid
            variant="albums"
            items={childItems.map((item) => ({
              id: item.id,
              displayName: item.displayName,
              slug: item.slug,
              albumCount: item.folderCount,
              folderCount: item.folderCount,
              trackCount: item.trackCount,
              hrefSegments: [...slugSegments, item.slug],
              downloaderSlug: [...slugSegments, item.slug].join("/"),
              isAlbum: item.level === "tracks",
              coverUrl: item.coverUrl,
            }))}
            emptyLabel="Nenhum disco ou pasta nesta coleção."
          />
        </section>
      )}

      {siblingNavItems.length > 1 && (
        <AtualizacoesMonthFooterNav
          monthSlug={currentSlug}
          months={[]}
          siblings={siblingNavItems}
          currentSiblingSlug={currentSlug}
          homeHref={homeHref}
          homeLabel="Home"
        />
      )}

      <CollectionsNavFooter href="/musicas/colecoes" label="Ver todas as coleções" />
    </div>
  );
}
