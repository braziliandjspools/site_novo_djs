"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, ListMusic, MonitorDown, Share2 } from "lucide-react";
import { PLACEHOLDER } from "../../lib/theme";
import { collectionsHref } from "../../lib/vip-music-slugs";
import { sendPackSlugToDownloader } from "../lib/send-to-downloader";
import { CollectionContextMenu, type CollectionMenuAction } from "./CollectionContextMenu";
import { SendPackToDownloaderButton } from "./SendPackToDownloaderButton";
import { useDownloaderSync } from "./DownloaderSyncContext";
import { useMusicasSession } from "./MusicasSessionContext";
import { useMusicasToast } from "./MusicasToast";

export type CollectionVolumeItem = {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  trackCount: number;
  coverUrl?: string | null;
  downloaderSlug: string;
  relativePath: string;
  hrefSegments: string[];
};

type CollectionVolumesViewProps = {
  volumes: CollectionVolumeItem[];
  canPlay: boolean;
  canDownload: boolean;
};

/** Lista de álbuns estilo biblioteca de streaming (capa + meta + ações). */
export function CollectionVolumesView({ volumes, canDownload }: CollectionVolumesViewProps) {
  const router = useRouter();
  const { authenticated, openLogin, hasVip } = useMusicasSession();
  const sync = useDownloaderSync();
  const { showToast } = useMusicasToast();

  if (volumes.length === 0) {
    return (
      <p className="rounded-2xl border border-zinc-800/80 bg-[#181818]/60 px-4 py-10 text-center text-sm text-zinc-500">
        Nenhum álbum ou volume nesta coleção.
      </p>
    );
  }

  async function sendAlbum(slug: string, name: string) {
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
      showToast(err instanceof Error ? err.message : `Erro ao enviar ${name}.`, "error");
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">Álbuns</h2>
      <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.06] bg-[#141414]/80">
        {volumes.map((volume) => {
          const href = collectionsHref(volume.hrefSegments);
          const cover = volume.coverUrl?.trim() || PLACEHOLDER.trackCover;
          const countLabel = `${volume.trackCount} ${volume.trackCount === 1 ? "faixa" : "faixas"}`;

          const actions: CollectionMenuAction[] = [
            {
              id: "open",
              label: "Abrir álbum",
              icon: ExternalLink,
              onClick: () => router.push(href),
            },
            {
              id: "tracks",
              label: "Ver todas as faixas",
              icon: ListMusic,
              onClick: () => router.push(href),
            },
            {
              id: "downloader",
              label: "Enviar álbum ao Downloader",
              icon: MonitorDown,
              onClick: () => void sendAlbum(volume.downloaderSlug, volume.displayName),
              disabled: !canDownload,
            },
            {
              id: "copy",
              label: "Copiar link",
              icon: Copy,
              onClick: () => {
                const absoluteUrl = `${window.location.origin}${href}`;
                void navigator.clipboard
                  .writeText(absoluteUrl)
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
                      await navigator.share({ title: volume.displayName, url: absoluteUrl });
                    } else {
                      await navigator.clipboard.writeText(absoluteUrl);
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
            <li key={volume.id} className="flex min-w-0 items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4">
              <Link
                href={href}
                className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded shadow-md ring-1 ring-white/10 sm:h-16 sm:w-16"
              >
                <Image
                  src={cover}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                  unoptimized={cover.startsWith("/api/")}
                />
              </Link>

              <Link href={href} className="min-w-0 flex-1 outline-none">
                <p className="truncate text-sm font-bold text-white sm:text-base">{volume.displayName}</p>
                <p className="mt-0.5 truncate text-xs text-zinc-500">{countLabel}</p>
              </Link>

              <div className="flex flex-shrink-0 items-center gap-0.5 sm:gap-1">
                {canDownload ? (
                  <SendPackToDownloaderButton
                    slug={volume.downloaderSlug}
                    root="colecoes"
                    compact
                    label={`Enviar ${volume.displayName} ao Downloader`}
                    className="!h-10 !w-10 !rounded-full !border-transparent !bg-transparent !text-zinc-400 hover:!bg-white/10 hover:!text-[#1ed760]"
                  />
                ) : null}
                <CollectionContextMenu
                  label={`Opções · ${volume.displayName}`}
                  buttonClassName="!text-zinc-400"
                  actions={actions}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
