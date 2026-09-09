"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  ExternalLink,
  FolderOpen,
  MonitorDown,
  Share2,
} from "lucide-react";
import { PLACEHOLDER } from "../../lib/theme";
import { collectionsHref } from "../../lib/vip-music-slugs";
import { sendPackSlugToDownloader } from "../lib/send-to-downloader";
import { CollectionContextMenu, type CollectionMenuAction } from "./CollectionContextMenu";
import { useDownloaderSync } from "./DownloaderSyncContext";
import { useMusicasSession } from "./MusicasSessionContext";
import { useMusicasToast } from "./MusicasToast";

export type CollectionCardData = {
  id: string;
  displayName: string;
  slug: string;
  albumCount: number;
  trackCount: number;
  hrefSegments?: string[];
  /** Quando true, trata como disco/álbum. */
  isAlbum?: boolean;
  folderCount?: number;
  downloaderSlug?: string;
  coverUrl?: string | null;
};

type CollectionAlbumGridProps = {
  items: CollectionCardData[];
  emptyLabel?: string;
  /** Catálogo de coleções: mostra só nº de álbuns. */
  variant?: "catalog" | "albums";
};

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export function CollectionAlbumGrid({
  items,
  emptyLabel = "Nenhuma coleção encontrada nesta pasta.",
  variant = "catalog",
}: CollectionAlbumGridProps) {
  const router = useRouter();
  const { authenticated, openLogin, hasVip } = useMusicasSession();
  const sync = useDownloaderSync();
  const { showToast } = useMusicasToast();

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-zinc-800/80 bg-[#181818]/60 px-4 py-10 text-center text-sm text-zinc-500">
        {emptyLabel}
      </p>
    );
  }

  async function sendToDownloader(slug: string, label: string) {
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
      const result = await sendPackSlugToDownloader(slug, {
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
      showToast(err instanceof Error ? err.message : `Erro ao enviar ${label}.`, "error");
    }
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((item) => {
        const href = collectionsHref(item.hrefSegments ?? [item.slug]);
        const packSlug = item.downloaderSlug ?? (item.hrefSegments ?? [item.slug]).join("/");
        const cover = item.coverUrl?.trim() || PLACEHOLDER.trackCover;
        const albumsOrFolders = item.isAlbum ? (item.folderCount ?? 0) : item.albumCount;
        const metaLabel = item.isAlbum
          ? `${item.trackCount} ${item.trackCount === 1 ? "faixa" : "faixas"}`
          : `${albumsOrFolders} ${albumsOrFolders === 1 ? "álbum" : "álbuns"}`;

        const actions: CollectionMenuAction[] = [
          {
            id: "open",
            label: item.isAlbum ? "Abrir álbum" : "Abrir coleção",
            icon: ExternalLink,
            onClick: () => router.push(href),
          },
          {
            id: "downloader",
            label: item.isAlbum ? "Enviar álbum ao Downloader" : "Enviar coleção ao Downloader",
            icon: MonitorDown,
            onClick: () => void sendToDownloader(packSlug, item.displayName),
          },
          {
            id: "copy",
            label: "Copiar link",
            icon: Copy,
            onClick: () => {
              const absoluteUrl = `${window.location.origin}${href}`;
              void copyText(absoluteUrl)
                .then(() => showToast("Link copiado"))
                .catch(() => showToast("Não foi possível copiar o link.", "error"));
            },
          },
          {
            id: "share",
            label: "Compartilhar",
            icon: Share2,
            onClick: () => {
              const absoluteUrl = `${window.location.origin}${href}`;
              void (async () => {
                try {
                  if (navigator.share) {
                    await navigator.share({ title: item.displayName, url: absoluteUrl });
                  } else {
                    await copyText(absoluteUrl);
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

        return (
          <article key={item.id} className="group relative min-w-0">
            <Link
              href={href}
              className="block min-w-0 rounded-lg outline-none transition active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#1ed760]/60"
            >
              <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-900 shadow-[0_8px_24px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.06] transition duration-300 group-hover:ring-white/15">
                <Image
                  src={cover}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                  unoptimized={cover.startsWith("/api/")}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-2.5 right-2.5 hidden opacity-0 transition group-hover:opacity-100 md:block">
                  <span className="pointer-events-none inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#1ed760] text-black shadow-lg">
                    <FolderOpen className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>

            <div className="mt-2.5 flex min-w-0 items-start gap-1">
              <Link href={href} className="min-w-0 flex-1 outline-none">
                <h3 className="line-clamp-2 text-sm font-bold leading-snug text-white transition-colors hover:underline">
                  {item.displayName}
                </h3>
                <p className="mt-0.5 truncate text-xs text-zinc-500">{metaLabel}</p>
              </Link>
              <CollectionContextMenu
                label={`Opções · ${item.displayName}`}
                buttonClassName="!h-8 !w-8 text-zinc-500 hover:text-white"
                actions={actions}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
